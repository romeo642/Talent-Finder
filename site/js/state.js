/** Shared screen state. Modules read this instead of loose globals. */

export const state = {
  mode: "in",
  photoData: "",
  user: null,
  reportUserId: "",
  workItems: [],
  adminFactorId: "",
  messageTalentId: "",
};
