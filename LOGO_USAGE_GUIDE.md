# Logo Usage Guide for Kandu

This guide explains how to use the logo components in your Kandu application.

## Available Logo Components

### 1. `Logo` Component (`src/Components/Logo.tsx`)
A CSS-based logo component that uses Tailwind classes for styling.

### 2. `LogoSVG` Component (`src/Components/LogoSVG.tsx`)
An SVG-based logo component that provides better scalability and crisp rendering at all sizes.

### 3. `Header` Component (`src/Components/Header.tsx`)
A reusable header component that includes the logo and can be customized with additional content.

## Basic Usage

### Import the Logo Component
```tsx
import Logo from './Components/Logo';
// or
import LogoSVG from './Components/LogoSVG';
```

### Basic Logo Display
```tsx
// Default size (medium) with text
<Logo />

// Large size with text
<Logo size="lg" />

// Small size, icon only (no text)
<Logo size="sm" showText={false} />
```

## Logo Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size of the logo |
| `showText` | `boolean` | `true` | Whether to show the "Kandu" text |
| `className` | `string` | `''` | Additional CSS classes |
| `onClick` | `() => void` | `undefined` | Click handler for the logo |

## Size Options

- **`sm`**: 24px icon, small text
- **`md`**: 32px icon, base text (default)
- **`lg`**: 40px icon, large text
- **`xl`**: 48px icon, extra large text

## Usage Examples

### 1. Header Navigation
```tsx
import Header from './Components/Header';

<Header onLogoClick={() => navigate('/home')}>
  <button>Profile</button>
  <button>Settings</button>
</Header>
```

### 2. Mobile App Header
```tsx
<div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
  <div className="flex items-center justify-between">
    <Logo size="sm" />
    <button className="text-white">
      <MenuIcon />
    </button>
  </div>
</div>
```

### 3. Landing Page Hero
```tsx
<div className="text-center">
  <Logo size="xl" className="mb-4" />
  <h1>Welcome to Kandu</h1>
  <p>Your AI-powered job search assistant</p>
</div>
```

### 4. Footer
```tsx
<footer className="bg-gray-800 text-white p-8">
  <div className="flex items-center justify-center space-x-3 mb-4">
    <Logo size="md" />
  </div>
  <p className="text-center text-gray-400">
    © 2025 Kandu. All rights reserved.
  </p>
</footer>
```

### 5. Interactive Logo
```tsx
<Logo 
  size="lg" 
  onClick={() => navigate('/home')}
  className="cursor-pointer hover:scale-105 transition-transform"
/>
```

## Integration with Existing Components

### Update Onboarding Screen
The onboarding screen has been updated to use the new Logo component:

```tsx
// Before
<div className="text-4xl mb-4">🚀</div>
<h1 className="text-3xl font-bold text-gray-900 mb-2">Kandu</h1>

// After
<div className="flex justify-center mb-4">
  <Logo size="xl" />
</div>
```

### Add to Navigation Components
You can add the logo to your existing navigation components:

```tsx
// In your navigation bar
<div className="flex items-center space-x-4">
  <Logo size="md" onClick={() => setScreen('home')} />
  <button onClick={() => setScreen('profile')}>Profile</button>
  <button onClick={() => setScreen('saved')}>Saved</button>
</div>
```

## Styling Customization

### Custom Colors
You can override the default gradient colors by modifying the Logo component:

```tsx
// In Logo.tsx, change the gradient classes
<div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
```

### Custom Sizes
Add new size options by extending the `sizeClasses` object:

```tsx
const sizeClasses = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-8 h-8 text-base',
  lg: 'w-10 h-10 text-lg',
  xl: 'w-12 h-12 text-xl',
  '2xl': 'w-16 h-16 text-2xl' // New size
};
```

## Best Practices

1. **Consistency**: Use the same logo component throughout your app for consistency
2. **Accessibility**: Always provide an `onClick` handler when the logo is clickable
3. **Responsive Design**: Use appropriate sizes for different screen sizes
4. **Performance**: Use the SVG version (`LogoSVG`) for better scalability on high-DPI displays
5. **Branding**: Keep the gradient colors consistent with your brand guidelines

## File Structure

```
src/
├── Components/
│   ├── Logo.tsx          # CSS-based logo component
│   ├── LogoSVG.tsx       # SVG-based logo component
│   ├── Header.tsx        # Header component with logo
│   └── LogoExamples.tsx  # Usage examples
└── public/
    └── favicon.svg       # Original SVG favicon
```

## Testing the Logo

To see all logo variations and examples, you can temporarily add the `LogoExamples` component to your app:

```tsx
import LogoExamples from './Components/LogoExamples';

// In your App.tsx or any screen
<LogoExamples />
```

This will show you all the different ways to use the logo components.

