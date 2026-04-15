import React from 'react';

export function LoadingScreen({ message = 'Cargando datos...' }: { message?: string }) {
  return (
    <div className="loading-screen">
      <div className="loading-screen__container">
        <div className="loading-screen__spinner">
          <div className="loading-screen__circle"></div>
          <div className="loading-screen__progress"></div>
          <div className="loading-screen__logo">A</div>
        </div>
        
        <div className="loading-screen__text">
          <h2 className="loading-screen__title">{message}</h2>
          <p className="loading-screen__subtitle">Preparando tu panel administrativo</p>
        </div>
      </div>
    </div>
  );
}
