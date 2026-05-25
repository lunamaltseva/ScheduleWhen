export interface RoomGroup {
  label: string;
  note: string;
  rooms: string[];
}

const COMP_LABS: { depts: string[]; rooms: string[]; note: string }[] = [
  { depts: ['SFW', 'AMI'], rooms: ['G30', 'G31', '432', '433'], note: 'SFW · AMI' },
  { depts: ['JMC', 'TCMA'], rooms: ['C07'], note: 'JMC · TCMA' },
  { depts: ['JMC', 'TCMA'], rooms: ['223', '233'], note: 'Graphic Design' },
];

export function getRoomGroups(target: number, filterDepts: string[]): RoomGroup[] {
  const groups: RoomGroup[] = [];

  if (target >= 60) {
    groups.push({ label: 'Large Rooms', note: '60+ seats', rooms: ['410', '434', '440', 'Forum'] });
  } else if (target >= 30) {
    groups.push({ label: 'Medium Rooms', note: '30–60 seats', rooms: ['G34', '220', '435'] });
    groups.push({ label: 'Large Rooms', note: '60+ seats', rooms: ['410', '434', '440', 'Forum'] });
  } else if (target >= 10) {
    groups.push({ label: 'Small Rooms', note: '10–30 seats', rooms: ['G35', 'G33', 'G32', '203', '305', '405'] });
    groups.push({ label: 'Medium Rooms', note: '30–60 seats', rooms: ['G34', '220', '435'] });
  } else {
    groups.push({ label: 'Very Small Rooms', note: '< 10 seats', rooms: ['211', '212', '213', '340', '411'] });
    groups.push({ label: 'Small Rooms', note: '10–30 seats', rooms: ['G35', 'G33', 'G32', '203', '305', '405'] });
  }

  // Append relevant computer labs when specific departments are in the filter
  if (filterDepts.length > 0) {
    for (const lab of COMP_LABS) {
      if (lab.depts.some(d => filterDepts.includes(d))) {
        if (!groups.some(g => g.label === 'Computer Labs' && g.note === lab.note)) {
          groups.push({ label: 'Computer Labs', note: lab.note, rooms: lab.rooms });
        }
      }
    }
  }

  return groups;
}
