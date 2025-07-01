// components/ComboBoxComponent.js
import React, { useEffect, useState } from "react";
import useHome from "../../hooks/useHome";
const companyRoemmersId = import.meta.env.VITE_API_COMPANY_ID

export const ComboBoxComponent = () => {
    const { getAllCompanies, getAllCompanyTypes, getData, companies, companyTypes, isLoading } = useHome();
    const [companySelected, setCompanySelected] = useState(companyRoemmersId);
    const [companyTypeSelected, setCompanyTypeSelected] = useState(null);

    useEffect(() => {
        getAllCompanies();
        getAllCompanyTypes(companyRoemmersId);
        getData(companySelected);
    }, []);

    const onCompanySelected = async (e) => {
        if (e.target.value) {
            setCompanySelected(e.target.value);
            await getAllCompanyTypes(e.target.value)
            await getData(e.target.value);
        }
    }

    const onCompanyTypeSelected = async (e) => {
        
        if (e.target.value) {
            if (e.target.value.toLowerCase() !== 'todas') {
                setCompanyTypeSelected(e.target.value);
                await getData(companySelected, e.target.value);
            }
            else {
                setCompanyTypeSelected(null);
                await getData(companySelected, null);
            }
        }
    }

    return (
        <div className="control-panel__right">

            <div className="control-panel__field">
                <label htmlFor="compania">Compañías</label>
                <select id="compania" name="compania" disabled={isLoading} onChange={onCompanySelected}>
                    {companies && companies?.map((company) => (
                        <option key={company.id} value={company.id}>
                            {company.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="control-panel__field">
                <label htmlFor="representacion">Representación</label>
                <select id="representacion" name="representacion" onChange={onCompanyTypeSelected}>
                    <option value="todas">Todas</option>
                    {companyTypes && companyTypes?.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                            {ct.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};