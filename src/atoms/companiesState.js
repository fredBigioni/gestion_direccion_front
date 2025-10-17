// src/atoms/companiesState.js
import { atom } from 'recoil';

export const companiesState = atom({
    key: 'companiesState',
    default: []
});

export const countriesState = atom({
    key: 'countriesState',
    default: []
});

export const companyTypesState = atom({
    key: 'companyTypesState',
    default: []
});

export const dataToShowState = atom({
    key: 'dataToShowState',
    default: null
})
