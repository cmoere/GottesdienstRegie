import {createElement, type HTMLAttributes} from 'react';
import {uiIcons, uiIconAttributes} from '../../shared/uiIcons';

type UiIconProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {name: string};

/** Local SVGs inherit their size and color from the surrounding control. */
export function UiIcon({name, className = '', ...attributes}: UiIconProps) {
  const nodes = Object.hasOwn(uiIcons, name) ? uiIcons[name] : uiIcons.help;
  const labelled = Boolean(attributes['aria-label'] || attributes['aria-labelledby']);
  return <span
    aria-hidden={labelled ? undefined : true}
    role={labelled ? 'img' : undefined}
    {...attributes}
    className={['ui-icon', className].filter(Boolean).join(' ')}
    data-icon={name}
  >
    <svg {...uiIconAttributes} fill={name === 'star' ? 'currentColor' : 'none'} width="1em" height="1em" aria-hidden="true" focusable="false">
      {nodes.map(([tag, props], index) => createElement(tag, {...props, key: index}))}
    </svg>
  </span>;
}
