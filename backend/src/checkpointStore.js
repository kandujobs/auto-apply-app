// Checkpoint state management for WebSocket-free checkpoint handling
// This allows the frontend to poll for checkpoint status and interact directly

/**
 * Checkpoint state types
 * @typedef {Object} CheckpointState
 * @property {'idle'|'running'|'checkpoint_required'|'done'|'failed'} state
 * @property {string} [message] - Error or status message
 * @property {string} [sessionId] - Session ID for checkpoint_required state
 * @property {string} [step] - Checkpoint step (e.g., 'captcha_or_2fa')
 * @property {string} [checkpointUrl] - URL of the checkpoint page
 * @property {number} [updatedAt] - Timestamp of last update
 */

// In-memory store for checkpoint states (key: userId)
const STORE = new Map();

/**
 * Set checkpoint state for a user
 * @param {string} userId - User ID
 * @param {CheckpointState} state - Checkpoint state
 */
function setState(userId, state) {
  const stateWithTimestamp = {
    ...state,
    updatedAt: Date.now()
  };
  STORE.set(userId, stateWithTimestamp);
  console.log(`[CheckpointStore] Set state for ${userId}:`, stateWithTimestamp);
}

/**
 * Get checkpoint state for a user
 * @param {string} userId - User ID
 * @returns {CheckpointState} Current state or idle
 */
function getState(userId) {
  const state = STORE.get(userId);
  if (!state) {
    return { state: 'idle' };
  }
  
  // Clean up old states (older than 30 minutes)
  if (Date.now() - state.updatedAt > 30 * 60 * 1000) {
    STORE.delete(userId);
    return { state: 'idle' };
  }
  
  return state;
}

/**
 * Clear checkpoint state for a user
 * @param {string} userId - User ID
 */
function clearState(userId) {
  STORE.delete(userId);
  console.log(`[CheckpointStore] Cleared state for ${userId}`);
}

/**
 * Get all active checkpoint states (for debugging)
 * @returns {Array} Array of {userId, state} objects
 */
function getAllStates() {
  return Array.from(STORE.entries()).map(([userId, state]) => ({
    userId,
    ...state
  }));
}

module.exports = {
  setState,
  getState,
  clearState,
  getAllStates
};
