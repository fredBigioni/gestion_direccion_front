// components/ComboBoxComponent.jsx
import React, { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import useHome from "../../hooks/useHome";
import { selectedCompanyState } from "../../atoms/selectedCompanyState";

const DEFAULT_COMPANY_ID = import.meta.env.VITE_API_COMPANY_ID;

export const ComboBoxComponent = ({ user }) => {
    const {
        getCompaniesByUser,
        getCountriesByUser,
        getAllCompanyTypes,
        getData,
        companies,
        companyTypes,
        countries,
        isLoading,
    } = useHome();

    const [companyTypeSelected, setCompanyTypeSelected] = useState(null);
    const [countrySelected, setCountrySelected] = useState("");
    const [companySelected, setCompanySelected] = useRecoilState(selectedCompanyState);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!user?.id) return;

        initializedRef.current = false;
        setCompanySelected("");
        setCountrySelected("");
        setCompanyTypeSelected(null);

        getCountriesByUser(user.id);
        getCompaniesByUser(user.id);
    }, [user?.id, getCountriesByUser, getCompaniesByUser]);

    useEffect(() => {
        if (!Array.isArray(companies) || companies.length === 0) {
            return;
        }
        if (initializedRef.current) {
            return;
        }

        let defaultCompany = companies.find(
            (c) => String(c.id) === String(DEFAULT_COMPANY_ID)
        );

        if (!defaultCompany) {
            defaultCompany = companies[0];
        }

        if (!defaultCompany) {
            return;
        }

        initializedRef.current = true;

        const defaultCompanyIdValue = Number(defaultCompany.id);
        if (Number.isNaN(defaultCompanyIdValue)) {
            return;
        }
        const defaultCompanyId = String(defaultCompanyIdValue);
        const defaultCountryId =
            defaultCompany.countryId != null ? String(defaultCompany.countryId) : "";

        setCompanySelected(defaultCompanyId);
        setCountrySelected(defaultCountryId);
        setCompanyTypeSelected(null);

        getAllCompanyTypes(defaultCompanyIdValue);
        getData(defaultCompanyIdValue, null, user?.id);
    }, [companies, getAllCompanyTypes, getData, user?.id, setCompanySelected]);

    const loadCompanyData = async (companyId) => {
        if (!companyId) return;

        const companyIdStr = String(companyId);
        const match = Array.isArray(companies)
            ? companies.find((c) => String(c.id) === companyIdStr)
            : null;

        if (match) {
            const matchCountryId =
                match.countryId != null ? String(match.countryId) : "";
            if (matchCountryId && matchCountryId !== countrySelected) {
                setCountrySelected(matchCountryId);
            }
        }

        setCompanySelected(companyIdStr);
        setCompanyTypeSelected(null);

        const numericCompanyId = Number(companyIdStr);
        if (Number.isNaN(numericCompanyId)) {
            return;
        }

        await getAllCompanyTypes(numericCompanyId);
        await getData(numericCompanyId, null, user?.id);
    };

    const onCompanySelected = async (event) => {
        const id = event.target.value;
        await loadCompanyData(id);
    };

    const onCompanyTypeSelected = async (event) => {
        const typeId = event.target.value;

        if (!typeId || typeId.toLowerCase() === "todas") {
            setCompanyTypeSelected(null);
            await getData(companySelected, null, user?.id);
            return;
        }

        setCompanyTypeSelected(typeId);
        await getData(companySelected, typeId, user?.id);
    };

    const onCountrySelected = async (event) => {
        const id = event.target.value;
        setCountrySelected(id);

        if (!Array.isArray(companies)) return;

        const filtered = companies.filter(
            (c) => String(c.countryId) === String(id)
        );

        if (filtered.length === 0) {
            setCompanySelected("");
            setCompanyTypeSelected(null);
            return;
        }

        const current = filtered.find(
            (c) => String(c.id) === String(companySelected)
        );
        const target = current ?? filtered[0];
        await loadCompanyData(target.id);
    };

    const countriesList = Array.isArray(countries) ? countries : [];
    const hasMultipleCompanies = Array.isArray(companies) && companies.length > 1;
    const shouldShowCountryCombo = hasMultipleCompanies && countriesList.length > 1;
    const effectiveCountry = shouldShowCountryCombo ? countrySelected : "";

    const companyOptions = Array.isArray(companies)
        ? companies.filter(
              (c) =>
                  !effectiveCountry ||
                  String(c.countryId) === String(effectiveCountry)
          )
        : [];

    return (
        <div className="control-panel__right">
            {shouldShowCountryCombo && (
                <div className="control-panel__field">
                    <label htmlFor="pais">Pais</label>
                    <select
                        id="pais"
                        name="pais"
                        disabled={isLoading || countriesList.length === 0}
                        value={countrySelected}
                        onChange={onCountrySelected}
                    >
                        <option value="" disabled>
                            Seleccione un pais
                        </option>
                        {countriesList.map((country) => (
                            <option key={country.id} value={country.id}>
                                {country.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="control-panel__field">
                <label htmlFor="compania">Companias</label>
                <select
                    id="compania"
                    name="compania"
                    disabled={isLoading || companyOptions.length === 0}
                    value={companySelected ?? ""}
                    onChange={onCompanySelected}
                >
                    {companyOptions.length === 0 && (
                        <option value="" disabled>
                            Sin companias disponibles
                        </option>
                    )}
                    {companyOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="control-panel__field">
                <label htmlFor="representacion">Representacion</label>
                <select
                    id="representacion"
                    name="representacion"
                    value={companyTypeSelected ?? "todas"}
                    onChange={onCompanyTypeSelected}
                >
                    <option value="todas">Todas</option>
                    {Array.isArray(companyTypes) &&
                        companyTypes.map((ct) => (
                            <option key={ct.id} value={ct.id}>
                                {ct.name}
                            </option>
                        ))}
                </select>
            </div>
        </div>
    );
};
