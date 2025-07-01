// hooks/useHome.js
import { useCallback, useRef } from "react";
import { useRecoilState } from "recoil";
import { companiesState, companyTypesState, dataToShowState, loadingState } from "../atoms";
import { message } from "antd";
import api from "../api/api";

const useHome = () => {
    const [isLoading, setIsLoading] = useRecoilState(loadingState);
    const [companies, setCompanies] = useRecoilState(companiesState);
    const [companyTypes, setCompanyTypes] = useRecoilState(companyTypesState);
    const [dataToShow, setDataToShow] = useRecoilState(dataToShowState);

    // Ref para recordar últimos filtros usados en getData
    const lastFiltersRef = useRef({ companyId: null, companyTypeId: null });

    const getAllCompanies = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/home/getAllCompanies`);
            setCompanies(response.data.companies);
        } catch (error) {
            console.error(error);
            message.error(`Error al obtener las compañías: ${error}`);
        } finally {
            setIsLoading(false);
        }
    }, [setCompanies, setIsLoading]);

    const getAllCompanyTypes = useCallback(async (companyId) => {
        try {
            setIsLoading(true);
            const response = await api.get(`/home/getAllCompanyTypes/${companyId}`);
            setCompanyTypes(response.data.companyTypes);
        } catch (error) {
            console.error(error);
            message.error(`Error al obtener las companyTypes: ${error}`);
        } finally {
            setIsLoading(false);
        }
    }, [setCompanyTypes, setIsLoading]);

    /**
     * Obtiene datos transpuestos para la grilla.
     * @param {number|null} companyId 
     * @param {number|null} companyTypeId 
     */
    const getData = useCallback(async (companyId = null, companyTypeId = null) => {
        try {
            setIsLoading(true);
            const params = {};
            if (companyId != null && companyId !== 0) params.companyId = companyId;
            if (companyTypeId != null && companyTypeId !== 0) params.companyTypeId = companyTypeId;
            console.log("useHome.getData: llamando API con params:", params);
            const response = await api.get('/home/getDataReportTranspoled', { params });
            console.log("useHome.getData: response.data:", response.data);
            if (Array.isArray(response.data)) {
                setDataToShow(response.data);
            } else if (Array.isArray(response.data.dataReport)) {
                setDataToShow(response.data.dataReport);
            } else {
                console.warn("useHome.getData: formato inesperado:", response.data);
                setDataToShow([]);
            }
            lastFiltersRef.current = { companyId, companyTypeId };
        } catch (error) {
            console.error("useHome.getData error:", error);
            message.error(`Error al obtener los datos: ${error.message || error}`);
        } finally {
            setIsLoading(false);
        }
    }, [setDataToShow, setIsLoading]);

    const deleteRegistro = useCallback(async (id) => {
        try {
            debugger
            await api.put(`/home/deleteRegistro/${id}`);
        } catch (error) {
            console.error("Error en deleteRegistro:", error);
            throw error;
        }
    }, []);

    /**
     * Vuelve a obtener datos usando los últimos filtros pasados a getData.
     */
    const refreshData = useCallback(async () => {
        const { companyId, companyTypeId } = lastFiltersRef.current;
        // Llamar getData con los mismos parámetros
        await getData(companyId, companyTypeId);
    }, [getData]);

    return {
        getAllCompanies,
        getAllCompanyTypes,
        getData,
        refreshData,
        deleteRegistro,
        companies,
        companyTypes,
        dataToShow,
        isLoading
    };
};

export default useHome;
