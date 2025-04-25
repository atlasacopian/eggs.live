'use client';

import React from 'react';
import styles from './TickerStrip.module.css';

// Accept an optional overrideBackgroundColor and fontSize prop
export default function TickerStrip({ text, overrideBackgroundColor, fontSize = '14px' /* Default size */ }) {
  // Prepare style object
  const containerStyle = {};
  if (overrideBackgroundColor) {
    containerStyle.backgroundColor = overrideBackgroundColor;
  }

  const tickerItemStyle = {
    fontSize: fontSize // Apply the fontSize prop
  };

  const extraClass = overrideBackgroundColor === 'white' ? styles.whiteBackground : '';

  const content = text;

  return (
    // Apply the dynamic style along with the module class
    <div className={`${styles.tickerContainer} ${extraClass}`} style={containerStyle}>
      {/* The wrapper now contains two identical spans for the animation */}
      <div className={styles.tickerWrap}>
        {/* Repeat content multiple times to ensure no gaps */}
        {[...Array(6)].map((_,i)=>(
          // Use dangerouslySetInnerHTML to render the styled spans and apply item style
          <span key={i} className={styles.tickerItem} style={tickerItemStyle} dangerouslySetInnerHTML={{ __html: content }} />
        ))}
      </div>
    </div>
  );
} 