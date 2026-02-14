import { createSlice } from "@reduxjs/toolkit";

type IssueReportState = {
  isIssueReportModalOpen: boolean;
};

const initialState: IssueReportState = {
  isIssueReportModalOpen: false,
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
    },
  },
});

export const { openIssueReportModal, closeIssueReportModal } =
  issueReportSlice.actions;

export default issueReportSlice.reducer;
