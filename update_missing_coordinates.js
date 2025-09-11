// Script to update missing latitude/longitude coordinates for existing users
// This can be run once to fix existing data

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// NY City coordinates mapping
const NY_CITY_COORDS = {
  "New York, NY": { lat: 40.7128, lng: -74.0060 },
  "Buffalo, NY": { lat: 42.8864, lng: -78.8784 },
  "Rochester, NY": { lat: 43.1566, lng: -77.6088 },
  "Yonkers, NY": { lat: 40.9312, lng: -73.8988 },
  "Syracuse, NY": { lat: 43.0481, lng: -76.1474 },
  "Albany, NY": { lat: 42.6526, lng: -73.7562 },
  "New Rochelle, NY": { lat: 40.9115, lng: -73.7824 },
  "Mount Vernon, NY": { lat: 40.9126, lng: -73.8371 },
  "Schenectady, NY": { lat: 42.8142, lng: -73.9396 },
  "Utica, NY": { lat: 43.1009, lng: -75.2327 },
  "White Plains, NY": { lat: 41.0330, lng: -73.7629 },
  "Troy, NY": { lat: 42.7284, lng: -73.6918 },
  "Niagara Falls, NY": { lat: 43.0962, lng: -79.0377 },
  "Binghamton, NY": { lat: 42.0987, lng: -75.9179 },
  "Rome, NY": { lat: 43.2128, lng: -75.4557 },
  "Long Beach, NY": { lat: 40.5884, lng: -73.6579 },
  "Poughkeepsie, NY": { lat: 41.7004, lng: -73.9210 },
  "North Tonawanda, NY": { lat: 43.0387, lng: -78.8642 },
  "Jamestown, NY": { lat: 42.0970, lng: -79.2353 },
  "Ithaca, NY": { lat: 42.4430, lng: -76.5019 },
  "Elmira, NY": { lat: 42.0898, lng: -76.8077 },
  "Newburgh, NY": { lat: 41.5034, lng: -74.0104 },
  "Middletown, NY": { lat: 41.4459, lng: -74.4229 },
  "Auburn, NY": { lat: 42.9317, lng: -76.5661 },
  "Watertown, NY": { lat: 43.9748, lng: -75.9108 },
  "Glen Cove, NY": { lat: 40.8623, lng: -73.6337 },
  "Saratoga Springs, NY": { lat: 43.0831, lng: -73.7845 },
  "Kingston, NY": { lat: 41.9270, lng: -74.0000 },
  "Peekskill, NY": { lat: 41.2892, lng: -73.9204 },
  "Lockport, NY": { lat: 43.1706, lng: -78.6903 },
  "Plattsburgh, NY": { lat: 44.6995, lng: -73.4529 }
};

async function updateMissingCoordinates() {
  try {
    console.log('Fetching profiles with missing coordinates...');
    
    // Get all profiles that have a location but no latitude/longitude
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, location, latitude, longitude')
      .not('location', 'is', null)
      .or('latitude.is.null,longitude.is.null');
    
    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      return;
    }
    
    console.log(`Found ${profiles.length} profiles with missing coordinates`);
    
    for (const profile of profiles) {
      const coordinates = NY_CITY_COORDS[profile.location];
      
      if (coordinates) {
        console.log(`Updating ${profile.location} with coordinates:`, coordinates);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            latitude: coordinates.lat,
            longitude: coordinates.lng
          })
          .eq('id', profile.id);
        
        if (updateError) {
          console.error(`Error updating profile ${profile.id}:`, updateError);
        } else {
          console.log(`Successfully updated profile ${profile.id}`);
        }
      } else {
        console.log(`No coordinates found for location: ${profile.location}`);
      }
    }
    
    console.log('Update complete!');
    
  } catch (error) {
    console.error('Error in updateMissingCoordinates:', error);
  }
}

// Run the update
updateMissingCoordinates();
