export interface MockUser {
  firstName: string;
  lastName: string;
  initials: string;
}

export const mockCurrentUser: MockUser = {
  firstName: 'Eva',
  lastName: 'Hansen',
  initials: 'EH',
};

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'God morgen';
  if (hour < 17) return 'God ettermiddag';
  return 'God kveld';
}
