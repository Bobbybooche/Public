import React from 'react';

/**
 * CountrySelector component displays a list of countries with progress
 * Used for filtering practice sessions by country
 */
function CountrySelector({ countries, selectedCountry, onSelect }) {
  if (!countries || countries.length === 0) {
    return (
      <div className="card empty-state">
        <p>No countries available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="section-title">Select Country</h3>
      <ul className="country-list">
        <li
          className={`country-item ${!selectedCountry ? 'country-item--selected' : ''}`}
          onClick={() => onSelect(null)}
          style={{
            background: !selectedCountry ? 'var(--color-background)' : 'transparent'
          }}
        >
          <span className="country-item__name">All Countries</span>
          <span className="country-item__progress">
            <span className="country-item__percent">-</span>
          </span>
        </li>

        {countries.map((country) => (
          <li
            key={country.id}
            className={`country-item ${selectedCountry === country.id ? 'country-item--selected' : ''}`}
            onClick={() => onSelect(country.id)}
            style={{
              background: selectedCountry === country.id ? 'var(--color-background)' : 'transparent'
            }}
          >
            <span className="country-item__name">
              {country.name}
              <span style={{
                marginLeft: '0.5rem',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)'
              }}>
                ({country.code})
              </span>
            </span>
            <div className="country-item__progress">
              <div className="country-item__bar">
                <div
                  className="country-item__bar-fill"
                  style={{ width: `${country.progress}%` }}
                />
              </div>
              <span className="country-item__percent">{country.progress}%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CountrySelector;
