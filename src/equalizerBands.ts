export type EqualizerBand = Readonly<{ frequency: string; spokenFrequency: string; group: 'Tiefen'|'Untere Mitten'|'Mitten'|'Höhen'; accessibleName(value:number): string }>;
const definitions=[
  ['31 Hz','31 Hertz','Tiefen'],['63 Hz','63 Hertz','Tiefen'],['125 Hz','125 Hertz','Tiefen'],
  ['250 Hz','250 Hertz','Untere Mitten'],['500 Hz','500 Hertz','Untere Mitten'],
  ['1 kHz','1 Kilohertz','Mitten'],['2 kHz','2 Kilohertz','Mitten'],
  ['4 kHz','4 Kilohertz','Höhen'],['8 kHz','8 Kilohertz','Höhen'],['16 kHz','16 Kilohertz','Höhen'],
] as const;
export const equalizerBands: readonly EqualizerBand[]=definitions.map(([frequency,spokenFrequency,group])=>Object.freeze({frequency,spokenFrequency,group,accessibleName:(value:number)=>`${group}, ${spokenFrequency}, ${value} Dezibel`}));
