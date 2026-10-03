import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {TestModeWatermark,testWatermarkText} from './TestModeWatermark';

afterEach(cleanup);

describe('TestModeWatermark',()=>{
  it('renders nothing in normal mode regardless of on-air state',()=>{
    const {rerender}=render(<TestModeWatermark role="main" visible={false}/>);
    expect(screen.queryByTestId('test-mode-watermark')).toBeNull();
    rerender(<TestModeWatermark role="livestream" visible={false}/>);
    expect(screen.queryByTestId('test-mode-watermark')).toBeNull();
  });
  it.each([['main','TESTBETRIEB'],['livestream','TESTBETRIEB'],['lobby','TESTBETRIEB'],['stage','TEST'],['notes','TEST']] as const)('uses the system label for %s', (role,label)=>{
    const {getByTestId}=render(<TestModeWatermark role={role} visible/>);
    expect(getByTestId('test-mode-watermark')).toHaveTextContent(label);
    expect(getByTestId('test-mode-watermark')).toHaveAttribute('aria-hidden','true');
    expect(testWatermarkText(role)).toBe(label);
  });
  it('can be the final layer above content, transitions and quick screens',()=>{
    const {container}=render(<div className="output"><div data-testid="content"/><div data-testid="transition"/><div data-testid="quick"/><TestModeWatermark role="main" visible/></div>);
    expect(container.querySelector('.output')?.lastElementChild).toHaveAttribute('data-testid','test-mode-watermark');
  });
});
