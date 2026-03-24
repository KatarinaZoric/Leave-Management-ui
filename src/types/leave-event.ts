
export type LeaveEventResponse = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  note: string;
  user: {
    name: string;
    email: string;
  };
  leaveType: {
    name: string;
    color?: string;
  };
};