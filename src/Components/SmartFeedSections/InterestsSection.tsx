import React, { useState, useEffect, useRef } from "react";
import Notification from "../Notification";
import { supabase } from '../../supabaseClient';
import './InterestsSection.css';

const DEFAULT_INTERESTS = [
  "Engineering",
  "Teaching",
  "IT",
  "Health",
  "Design",
  "Technology",
  "Fashion",
  "Law",
];

interface InterestsSectionProps {
  interests?: string[];
  onInterestsUpdated?: (newInterests: string[]) => void;
}

const InterestsSection: React.FC<InterestsSectionProps> = ({ interests: propInterests, onInterestsUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [interests, setInterests] = useState<string[]>(propInterests && propInterests.length ? propInterests : DEFAULT_INTERESTS);
  const [localInterests, setLocalInterests] = useState<string[]>(propInterests && propInterests.length ? propInterests : DEFAULT_INTERESTS);
  const [newInterest, setNewInterest] = useState("");
  const [showEditNotification, setShowEditNotification] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [rowWidth, setRowWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollKey, setScrollKey] = useState(0);
  const [addingNew, setAddingNew] = useState(false);
  const [newInterestValue, setNewInterestValue] = useState("");

  // Measure widths and determine if animation is needed
  useEffect(() => {
    function measure() {
      if (rowRef.current && containerRef.current) {
        const rowW = rowRef.current.scrollWidth;
        const contW = containerRef.current.offsetWidth;
        setRowWidth(rowW);
        setContainerWidth(contW);
        setShouldAnimate(rowW > contW + 2); // +2 for rounding
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [localInterests, interests, isEditing]);

  // Update interests from props
  useEffect(() => {
    if (propInterests && propInterests.length) {
      setInterests(propInterests);
      setLocalInterests(propInterests);
    } else {
      setInterests(DEFAULT_INTERESTS);
      setLocalInterests(DEFAULT_INTERESTS);
    }
  }, [propInterests]);

  const addInterest = () => {
    if (newInterest.trim() && !localInterests.includes(newInterest.trim())) {
      setLocalInterests([...localInterests, newInterest.trim()]);
      setNewInterest("");
      setTimeout(() => {
        addInputRef.current?.focus();
      }, 100);
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setLocalInterests(localInterests.filter((i) => i !== interestToRemove));
  };

  const handleSave = async () => {
    setIsEditing(false);
    setInterests(localInterests);
    // Only update Supabase and parent on save
    if (typeof onInterestsUpdated === 'function') {
      onInterestsUpdated(localInterests);
    }
  };

  // Add interest bubble logic
  const handleAddBubbleClick = () => {
    setAddingNew(true);
    setNewInterestValue("");
    setTimeout(() => {
      addInputRef.current?.focus();
    }, 100);
  };

  // Save or discard new interest bubble on blur
  const handleNewInterestBlur = () => {
    if (newInterestValue.trim()) {
      setLocalInterests([...localInterests, newInterestValue.trim()]);
    }
    setAddingNew(false);
    setNewInterestValue("");
  };

  // Exit edit mode on outside click
  useEffect(() => {
    if (!isEditing) return;
    function handleClickOutside(event: MouseEvent) {
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
        // If adding new and value exists, save it
        if (addingNew && newInterestValue.trim()) {
          setLocalInterests([...localInterests, newInterestValue.trim()]);
        }
        setAddingNew(false);
        setNewInterestValue("");
        handleSave();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, localInterests, addingNew, newInterestValue]);

  // Add interest on button or Enter
  const handleAddInterest = () => {
    if (newInterest.trim() && !localInterests.includes(newInterest.trim())) {
      setLocalInterests([...localInterests, newInterest.trim()]);
      setNewInterest("");
      setTimeout(() => {
        addInputRef.current?.focus();
      }, 100);
    }
  };
  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddInterest();
  };

  // Edit mode: click any interest to enter edit mode
  const handleInterestClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      addInputRef.current?.focus();
    }, 100);
  };

  // Animation style for overflow
  const animationStyle = shouldAnimate
    ? {
        width: rowWidth,
        animation: `carousel-x ${((rowWidth - containerWidth) / 40).toFixed(2)}s linear 1`,
      }
    : {};

  // On animation end, reset scrollKey to force remount and restart animation
  const handleAnimationEnd = () => {
    setScrollKey(k => k + 1);
  };

  return (
    <div className="w-full space-y-3" ref={sectionRef}>
      <div className="w-full overflow-x-auto px-0 relative scrollbar-hide" style={{height: 48}} ref={containerRef}>
        <div
          className={
            "interests-carousel flex gap-3 whitespace-nowrap min-w-0 justify-center"
          }
          ref={rowRef}
          style={{}}
        >
          {(isEditing ? localInterests : interests).map((interest, i) => (
            <div
              key={i}
              className="bg-purple-100 text-purple-700 font-semibold text-[16px] rounded-full px-4 py-1 flex items-center gap-1 min-w-max cursor-pointer"
              style={{ minHeight: 32 }}
              onClick={!isEditing ? handleInterestClick : undefined}
            >
              <span>{interest}</span>
              {isEditing && (
                <button
                  onClick={e => { e.stopPropagation(); removeInterest(interest); }}
                  className="text-gray-500 hover:text-gray-700 text-xs ml-1"
                  aria-label={`Remove ${interest}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {/* New interest bubble in edit mode */}
          {isEditing && addingNew && (
            <input
              ref={addInputRef}
              type="text"
              value={newInterestValue}
              onChange={e => setNewInterestValue(e.target.value)}
              onBlur={handleNewInterestBlur}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  if (newInterestValue.trim()) {
                    setLocalInterests([...localInterests, newInterestValue.trim()]);
                  }
                  setAddingNew(false);
                  setNewInterestValue("");
                }
              }}
              className="bg-purple-50 text-purple-700 font-semibold text-[16px] rounded-full px-4 py-1 flex items-center min-w-max focus:ring-2 focus:ring-purple-400 mx-0"
              style={{ minHeight: 32, height: 32, width: 90, maxWidth: 140 }}
              placeholder="New..."
              autoFocus
            />
          )}
          {/* Plus button styled as interest bubble */}
          {isEditing && !addingNew && (
            <button
              onClick={handleAddBubbleClick}
              className="bg-purple-100 text-purple-700 font-bold text-[22px] rounded-full px-4 py-1 flex items-center justify-center min-w-max cursor-pointer hover:bg-purple-200 transition"
              style={{ minHeight: 32, height: 32 }}
              aria-label="Add Interest Bubble"
            >
              +
            </button>
          )}
        </div>
      </div>
      {/* Notification remains unchanged */}
      <Notification
        message="Interests updated successfully!"
        isVisible={showEditNotification}
        onClose={() => setShowEditNotification(false)}
        duration={2000}
      />
    </div>
  );
};

export default InterestsSection; 