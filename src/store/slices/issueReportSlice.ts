import { createSlice } from "@reduxjs/toolkit";

type IssueReportState = {
  isIssueReportModalOpen: boolean;
  isSubmitting: boolean;
};

const initialState: IssueReportState = {
  isIssueReportModalOpen: false,
  isSubmitting: false,
};

export const issueReportSlice = createSlice({
  name: "issueReport",
  initialState,
  reducers: {
    openIssueReportModal: (state) => {
      state.isIssueReportModalOpen = true;
    },
    closeIssueReportModal: (state) => {
      state.isIssueReportModalOpen = false;
      state.isSubmitting = false;
    },
    setIssueReportSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },
  },
});

export const {
  openIssueReportModal,
  closeIssueReportModal,
  setIssueReportSubmitting,
} = issueReportSlice.actions;

export default issueReportSlice.reducer;
