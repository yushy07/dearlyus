'use client';

import { useMemo } from 'react';
import { City, Country, State } from 'country-state-city';
import styles from './LocationSelector.module.css';

export type ProfileLocation = {
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  value: ProfileLocation;
  onChange: (value: ProfileLocation) => void;
  idPrefix?: string;
  required?: boolean;
  className?: string;
  onTimezoneChange?: (timezone: string) => void;
};

const countries = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));

function sameName(left: string, right: string) {
  return left.trim().localeCompare(right.trim(), undefined, { sensitivity: 'accent' }) === 0;
}

export function LocationSelector({ value, onChange, idPrefix = 'profile', required = true, className = '', onTimezoneChange }: Props) {
  const states = useMemo(() => value.countryCode ? State.getStatesOfCountry(value.countryCode).sort((a, b) => a.name.localeCompare(b.name)) : [], [value.countryCode]);
  const cities = useMemo(() => {
    if (!value.countryCode) return [];
    const list = value.stateCode ? City.getCitiesOfState(value.countryCode, value.stateCode) : (states.length ? [] : City.getCitiesOfCountry(value.countryCode) || []);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [states.length, value.countryCode, value.stateCode]);

  const chooseCountry = (countryCode: string) => {
    const country = countries.find((item) => item.isoCode === countryCode);
    onChange({ country: country?.name || '', countryCode, state: '', stateCode: '', city: '', latitude: null, longitude: null });
    const suggestedTimezone = country?.timezones?.[0]?.zoneName;
    if (suggestedTimezone) onTimezoneChange?.(suggestedTimezone);
  };
  const chooseState = (stateCode: string) => {
    const state = states.find((item) => item.isoCode === stateCode);
    onChange({ ...value, state: state?.name || '', stateCode, city: '', latitude: null, longitude: null });
  };
  const chooseCity = (cityName: string) => {
    const city = cities.find((item) => item.name === cityName);
    onChange({ ...value, city: cityName, latitude: city?.latitude ? Number(city.latitude) : null, longitude: city?.longitude ? Number(city.longitude) : null });
  };

  const typeCountry = (countryName: string) => {
    const match = countries.find((item) => sameName(item.name, countryName));
    if (match) {
      chooseCountry(match.isoCode);
      return;
    }
    onChange({ country: countryName, countryCode: '', state: '', stateCode: '', city: '', latitude: null, longitude: null });
  };
  const typeState = (stateName: string) => {
    const match = states.find((item) => sameName(item.name, stateName));
    if (match) {
      chooseState(match.isoCode);
      return;
    }
    onChange({ ...value, state: stateName, stateCode: '', city: '', latitude: null, longitude: null });
  };
  const typeCity = (cityName: string) => {
    const match = cities.find((item) => sameName(item.name, cityName));
    if (match) {
      chooseCity(match.name);
      return;
    }
    onChange({ ...value, city: cityName, latitude: null, longitude: null });
  };

  return <div className={`${styles.grid} ${className}`}>
    <label htmlFor={`${idPrefix}-country`}><span>Country</span><input id={`${idPrefix}-country`} list={`${idPrefix}-country-options`} value={value.country} onChange={(event) => typeCountry(event.target.value)} placeholder="Type your country" autoComplete="country-name" required={required} /><datalist id={`${idPrefix}-country-options`}>{countries.map((country) => <option key={country.isoCode} value={country.name}>{country.flag} {country.name}</option>)}</datalist></label>
    <label htmlFor={`${idPrefix}-state`}><span>State or region</span><input id={`${idPrefix}-state`} list={`${idPrefix}-state-options`} value={value.state} onChange={(event) => typeState(event.target.value)} placeholder={!value.countryCode ? 'Choose country first' : states.length ? 'Type your state or region' : 'No state selection needed'} autoComplete="address-level1" disabled={!value.countryCode || states.length === 0} required={required && states.length > 0} /><datalist id={`${idPrefix}-state-options`}>{states.map((state) => <option key={state.isoCode} value={state.name} />)}</datalist></label>
    <label htmlFor={`${idPrefix}-city`}><span>City</span><input id={`${idPrefix}-city`} list={`${idPrefix}-city-options`} value={value.city} onChange={(event) => typeCity(event.target.value)} placeholder={!value.countryCode ? 'Choose country first' : states.length > 0 && !value.stateCode ? 'Choose state first' : 'Type your city'} autoComplete="address-level2" disabled={!value.countryCode || (states.length > 0 && !value.stateCode)} required={required} /><datalist id={`${idPrefix}-city-options`}>{cities.map((city) => <option key={`${city.stateCode}-${city.name}`} value={city.name} />)}</datalist></label>
    {value.city && <p className={styles.summary}>♡ {value.city}{value.state ? `, ${value.state}` : ''}, {value.country}</p>}
  </div>;
}
