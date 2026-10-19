import React from 'react';
import './BrandLogo.css';

export default function BrandLogo({ className = '', size = 'normal' }) {
  return (
    <img
      src="/images/logo.png"
      alt="Equilíbrio Saudável"
      className={`es-brand-logo es-brand-logo--${size} ${className}`}
      loading="eager"
    />
  );
}