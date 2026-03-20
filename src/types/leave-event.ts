
export type LeaveEventResponse = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  user: {
    name: string;
    email: string;
  };
  leaveType: {
    name: string;
    color?: string;
  };
};