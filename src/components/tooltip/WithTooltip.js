import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import TooltipTrigger from 'react-popper-tooltip';
import uuid from 'uuid';
import keyCode from 'keycode';

import { Tooltip } from './Tooltip';

// A target that doesn't speak popper
const ButtonContainer = styled.button`
  background: transparent;
  border: 0;
  cursor: ${props => (props.mode === 'hover' ? 'default' : 'pointer')};
  display: inline-block;
  font-size: inherit;
  font-weight: inherit;
  margin: 0;
  padding: 0;
  text-align: inherit;
  text-decoration: none;
`;

const isDescendantOfAction = element => {
  const { parentElement } = element;

  if (parentElement.tagName === 'BODY') {
    return false;
  }

  if (parentElement.tagName === 'A' || parentElement.tagName === 'BUTTON') {
    return true;
  }

  return isDescendantOfAction(parentElement);
};

const AsComponent = React.forwardRef(
  ({ as, onClick, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const Component = as || ButtonContainer;
    const asProps = {
      ref,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onFocus: onMouseEnter,
      onBlur: onMouseLeave,
      role: 'button',
      ...props,
    };

    const onKeyDown = useMemo(
      () => event => {
        if (!onClick) {
          return;
        }
        if (event.keyCode === keyCode('enter') || event.keyCode === keyCode('space')) {
          event.preventDefault();
          onClick(event);
        }
      },
      [onClick]
    );

    // for non button component, we need to simulate the same behavior as a button
    if (as) {
      asProps.tabIndex = 0;
      asProps.onKeyDown = onKeyDown;
    }
    return <Component {...asProps} />;
  }
);
AsComponent.propTypes = {
  as: PropTypes.string,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
};
AsComponent.defaultProps = {
  as: undefined,
  onClick: undefined,
  onMouseEnter: undefined,
  onMouseLeave: undefined,
};

function WithTooltip({
  as,
  trigger,
  closeOnClick,
  placement,
  modifiers,
  hasChrome,
  tooltip,
  children,
  startOpen,
  ...props
}) {
  const id = React.useMemo(() => uuid.v4(), []);
  const [isTooltipShown, setTooltipShown] = useState(startOpen);
  const closeTooltip = useMemo(() => () => setTooltipShown(false), [setTooltipShown]);
  const closeTooltipOnClick = useMemo(
    () => event => {
      if (!closeOnClick || !isDescendantOfAction(event.target)) {
        return;
      }
      setTooltipShown(false);
    },
    [closeOnClick, setTooltipShown]
  );

  return (
    <TooltipTrigger
      placement={placement}
      trigger={trigger}
      tooltipShown={isTooltipShown}
      onVisibilityChange={setTooltipShown}
      modifiers={modifiers}
      tooltip={({
        getTooltipProps,
        getArrowProps,
        tooltipRef,
        arrowRef,
        placement: tooltipPlacement,
      }) => (
        <Tooltip
          hasChrome={hasChrome}
          placement={tooltipPlacement}
          tooltipRef={tooltipRef}
          arrowRef={arrowRef}
          arrowProps={getArrowProps()}
          onClick={closeTooltipOnClick}
          {...getTooltipProps()}
          id={id}
          role="tooltip"
        >
          {typeof tooltip === 'function' ? tooltip({ onHide: closeTooltip }) : tooltip}
        </Tooltip>
      )}
    >
      {({ getTriggerProps, triggerRef }) => (
        <AsComponent
          as={as}
          ref={triggerRef}
          {...getTriggerProps()}
          {...props}
          aria-controls={id}
          aria-describedby={isTooltipShown ? id : undefined}
        >
          {children}
        </AsComponent>
      )}
    </TooltipTrigger>
  );
}

WithTooltip.propTypes = {
  as: PropTypes.string,
  trigger: PropTypes.string,
  closeOnClick: PropTypes.bool,
  placement: PropTypes.string,
  modifiers: PropTypes.shape({}),
  hasChrome: PropTypes.bool,
  tooltip: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  children: PropTypes.node.isRequired,
  startOpen: PropTypes.bool,
};

WithTooltip.defaultProps = {
  as: undefined,
  trigger: 'hover',
  closeOnClick: false,
  placement: 'top',
  modifiers: {},
  hasChrome: true,
  startOpen: false,
};

export default WithTooltip;
