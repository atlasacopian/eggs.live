// app/components/price-history-graph.tsx
// Component for displaying the price history graph

'use client'

import { useState, useEffect } from 'react'

interface PricePoint {
  date: string;
  price: number;
}

export default function PriceHistoryGraph({ 
  data, 
  eggType = 'REGULAR',
  height = 300
}: { 
  data: PricePoint[]; 
  eggType?: string;
  height?: number;
}) {
  // Sort data chronologically (oldest first)
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate min/max for scaling
  const maxPrice = Math.max(...sortedData.map(d => d.price));
  const minPrice = Math.min(...sortedData.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  
  // Custom styles
  const styles = {
    graph: {
      width: '100%',
      height: `${height}px`,
      border: '1px solid #00ff00',
      marginTop: '20px',
      position: 'relative',
      padding: '20px'
    },
    graphPoint: {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: '#00ff00',
      borderRadius: '50%',
      transform: 'translate(-50%, 50%)'
    },
    graphLabel: {
      position: 'absolute',
      fontSize: '12px',
      transform: 'translateX(-50%)'
    },
    dataSource: {
      fontSize: '12px',
      marginTop: '10px',
      opacity: '0.7',
      textAlign: 'right'
    }
  };
  
  return (
    <div style={styles.graph}>
      {/* X and Y axes */}
      <div style={{
        position: 'absolute',
        left: '50px',
        top: '20px',
        bottom: '50px',
        width: '2px',
        backgroundColor: '#00ff00'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '50px',
        left: '50px',
        right: '20px',
        height: '2px',
        backgroundColor: '#00ff00'
      }}></div>
      
      {/* Price labels */}
      <div style={{
        position: 'absolute',
        left: '20px',
        top: '20px',
        fontSize: '14px'
      }}>${maxPrice.toFixed(2)}</div>
      <div style={{
        position: 'absolute',
        left: '20px',
        bottom: '40px',
        fontSize: '14px'
      }}>${minPrice.toFixed(2)}</div>
      
      {/* Graph points and lines */}
      {sortedData.map((point, index) => {
        const x = 50 + (index / (sortedData.length - 1)) * (100 - 10) + '%'
        const y = 100 - ((point.price - minPrice) / priceRange) * 100 + '%'
        
        return (
          <div key={index}>
            {/* Point */}
            <div style={{
              ...styles.graphPoint,
              left: x,
              bottom: y
            }}></div>
            
            {/* Line to next point */}
            {index < sortedData.length - 1 && (
              <div style={{
                position: 'absolute',
                left: x,
                bottom: y,
                width: (1 / (sortedData.length - 1)) * (100 - 10) + '%',
                height: '2px',
                backgroundColor: '#00ff00',
                transform: 'translateY(1px)',
                transformOrigin: 'left bottom',
                rotate: Math.atan2(
                  ((sortedData[index + 1].price - minPrice) / priceRange) * 100 - 
                  ((point.price - minPrice) / priceRange) * 100,
                  100 / (sortedData.length - 1)
                ) + 'rad'
              }}></div>
            )}
            
            {/* Date label - only show every other month for clarity */}
            {index % 2 === 0 && (
              <div style={{
                ...styles.graphLabel,
                left: x,
                bottom: '30px'
              }}>{point.date.split('/')[0]}/{point.date.split('/')[2].substring(2)}</div>
            )}
          </div>
        )
      })}
      
      <div style={styles.dataSource}>
        Source: USDA Agricultural Marketing Service
      </div>
    </div>
  );
}
