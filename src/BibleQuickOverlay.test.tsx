import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuickScreenConfig } from './preferences';
import { BibleQuickOverlay } from './BibleQuickOverlay';
import { QuickOverlay } from './QuickOverlay';

const quick: QuickScreenConfig = {
  id: 'bible-test', type: 'bible', name: 'Johannes 3,16–17', enabled: true, targets: ['main'], order: 0,
  reference: 'Johannes 3,16–17', translation: 'Luther 1912', pageIndex: 0,
  pages: [['16 Denn also hat Gott die Welt geliebt.', '17 Denn Gott hat seinen Sohn nicht gesandt.'], ['18 Wer an ihn glaubt, wird nicht gerichtet.']],
};

afterEach(cleanup);

describe('BibleQuickOverlay', () => {
  it('keeps the complete current page and metadata accessible', () => {
    render(<BibleQuickOverlay quick={quick} reducedMotion={false} staticPreview={false}/>);
    expect(screen.getByText('Johannes 3,16–17')).toBeInTheDocument();
    expect(screen.getByText('Luther 1912')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('Denn also hat Gott die Welt geliebt.')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('uses a dense layout for long pages without removing text', () => {
    const longLine = `1 ${'Sehr langer Bibeltext '.repeat(45)}`;
    const dense = { ...quick, pages: [[longLine, longLine, longLine]] };
    const { container } = render(<BibleQuickOverlay quick={dense} reducedMotion={false} staticPreview={false}/>);
    expect(container.querySelector('.bible-page')).toHaveClass('density-high');
    expect(screen.getAllByText(/Sehr langer Bibeltext/)).toHaveLength(3);
  });

  it('replaces the page deterministically and disables motion when requested', () => {
    const { container, rerender } = render(<BibleQuickOverlay quick={quick} reducedMotion staticPreview={false}/>);
    expect(container.querySelector('.bible-page')).toHaveClass('no-animation');
    rerender(<BibleQuickOverlay quick={{ ...quick, pageIndex: 1 }} reducedMotion={false} staticPreview/>);
    expect(container.querySelector('.bible-page')).toHaveClass('no-animation');
    expect(screen.getByText('Wer an ihn glaubt, wird nicht gerichtet.')).toBeInTheDocument();
    expect(screen.queryByText('Denn also hat Gott die Welt geliebt.')).not.toBeInTheDocument();
  });

  it('keeps the Bible mounted for its exit animation before clearing it', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<QuickOverlay quick={quick}/>);
    rerender(<QuickOverlay quick={null}/>);
    expect(container.querySelector('.quick-overlay')).toHaveClass('leaving');
    act(() => vi.advanceTimersByTime(500));
    expect(container.querySelector('.quick-overlay')).toBeNull();
    vi.useRealTimers();
  });
});
