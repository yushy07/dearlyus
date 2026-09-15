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
};

const countries = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));

export function LocationSelector({ value, onChange, idPrefix = 'profile', required = true, className = '' }: Props) {
  const states = useMemo(() => value.countryCode ? State.getStatesOfCountry(value.countryCode).sort((a, b) => a.name.localeCompare(b.name)) : [], [value.countryCode]);
  const cities = useMemo(() => {
    if (!value.countryCode) return [];
    const list = value.stateCode ? City.getCitiesOfState(value.countryCode, value.stateCode) : (states.length ? [] : City.getCitiesOfCountry(value.countryCode) || []);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [states.length, value.countryCode, value.stateCode]);

  const chooseCountry = (countryCode: string) => {
    const country = countries.find((item) => item.isoCode === countryCode);
    onChange({ country: country?.name || '', countryCode, state: '', stateCode: '', city: '', latitude: null, longitude: null });
  };
  const chooseState = (stateCode: string) => {
    const state = states.find((item) => item.isoCode === stateCode);
    onChange({ ...value, state: state?.name || '', stateCode, city: '', latitude: null, longitude: null });
  };
  const chooseCity = (cityName: string) => {
    const city = cities.find((item) => item.name === cityName);
    onChange({ ...value, city: cityName, latitude: city?.latitude ? Number(city.latitude) : null, longitude: city?.longitude ? Number(city.longitude) : null });
  };

  return <div className={`${styles.grid} ${className}`}>
    <label htmlFor={`${idPrefix}-country`}><span>Country</span><select id={`${idPrefix}-country`} value={value.countryCode} onChange={(event) => chooseCountry(event.target.value)} required={required}><option value="">Choose your country</option>{countries.map((country) => <option key={country.isoCode} value={country.isoCode}>{country.flag} {country.name}</option>)}</select></label>
    <label htmlFor={`${idPrefix}-state`}><span>State or region</span><select id={`${idPrefix}-state`} value={value.stateCode} onChange={(event) => chooseState(event.target.value)} disabled={!value.countryCode || states.length === 0} required={required && states.length > 0}><option value="">{states.length ? 'Choose your state or region' : value.countryCode ? 'No state selection needed' : 'Choose country first'}</option>{states.map((state) => <option key={state.isoCode} value={state.isoCode}>{state.name}</option>)}</select></label>
    <label htmlFor={`${idPrefix}-city`}><span>City</span><select id={`${idPrefix}-city`} value={value.city} onChange={(event) => chooseCity(event.target.value)} disabled={!value.countryCode || (states.length > 0 && !value.stateCode)} required={required}><option value="">{!value.countryCode ? 'Choose country first' : states.length > 0 && !value.stateCode ? 'Choose state first' : 'Choose your city'}</option>{cities.map((city) => <option key={`${city.stateCode}-${city.name}`} value={city.name}>{city.name}</option>)}</select></label>
    {value.city && <p className={styles.summary}>♡ {value.city}{value.state ? `, ${value.state}` : ''}, {value.country}</p>}
  </div>;
}
