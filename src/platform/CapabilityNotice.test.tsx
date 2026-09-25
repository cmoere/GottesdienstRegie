import {render,screen} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import {PlatformProvider} from './PlatformContext';
import {createWebServices} from './web/createWebServices';
import {CapabilityNotice} from './CapabilityNotice';

describe('CapabilityNotice',()=>{
  it('erklärt eine Desktop-exklusive Fähigkeit',()=>{
    render(<PlatformProvider services={createWebServices()}><CapabilityNotice capability="outputMain"/></PlatformProvider>);
    expect(screen.getByRole('note')).toHaveTextContent('MAIN-Ausgabe benötigt die Desktop-App.');
    expect(screen.getByRole('link',{name:'Desktop-App herunterladen'})).toHaveAttribute('href','https://github.com/cmoere/GottesdienstRegie/releases/latest');
  });
});
