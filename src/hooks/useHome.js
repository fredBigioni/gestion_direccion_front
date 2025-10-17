// hooks/useHome.js
import { useCallback, useRef } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import {
    companiesState,
    countriesState,
    companyTypesState,
    dataToShowState,
    loadingState,
    selectedCompanyState,
} from "../atoms";
import { message } from "antd";
import api from "../api/api";
import useAuth from "./useAuth";

const useHome = () => {
    const [isLoading, setIsLoading] = useRecoilState(loadingState);
    const [companies, setCompanies] = useRecoilState(companiesState);
    const [countries, setCountries] = useRecoilState(countriesState);
    const [companyTypes, setCompanyTypes] = useRecoilState(companyTypesState);
    const [dataToShow, setDataToShow] = useRecoilState(dataToShowState);
    const { auth } = useAuth();

    // Compañía actualmente seleccionada en el estado global
    const selectedCompanyId = useRecoilValue(selectedCompanyState);

    // Ref para recordar últimos filtros usados en getData
    const lastFiltersRef = useRef({ companyTypeId: null, userId: null });

    const getCompaniesByUser = useCallback(async (userId) => {
        if (!userId) {
            setCompanies([]);
            return;
        }
        try {
            setIsLoading(true);
            const response = await api.get(`/home/getCompaniesByUser/${userId}`);
            setCompanies(response.data.companies ?? []);
        } catch (error) {
            console.error(error);
            message.error(`Error al obtener las companias del usuario: ${error}`);
        } finally {
            setIsLoading(false);
        }
    }, [setCompanies, setIsLoading]);

    const getCountriesByUser = useCallback(async (userId) => {
        if (!userId) {
            setCountries([]);
            return;
        }
        try {
            setIsLoading(true);
            const response = await api.get(`/home/getCountriesByUser/${userId}`);
            setCountries(response.data.countries ?? []);
        } catch (error) {
            console.error(error);
            message.error(`Error al obtener los paises del usuario: ${error}`);
        } finally {
            setIsLoading(false);
        }
    }, [setCountries, setIsLoading]);

    const getAllCompanyTypes = useCallback(
        async (companyId) => {
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
        },
        [setCompanyTypes, setIsLoading]
    );

    /**
     * Obtiene datos transpuestos para la grilla.
     * @param {number|null} companyId
     * @param {number|null} companyTypeId
     * @param {number|null} userId
     */
    const getData = useCallback(
        async (companyId = null, companyTypeId = null, userId = null) => {
            try {
                setIsLoading(true);
                const params = {};

                // Siempre filtrar por compañía actual
                if (companyId != null && companyId !== 0) params.companyId = companyId;
                else params.companyId = 1;

                if (companyTypeId != null && companyTypeId !== 0)
                    params.companyTypeId = companyTypeId;
                if (userId != null && userId !== 0) params.userId = userId;

                console.log("useHome.getData: llamando API con params:", params);
                const response = await api.get("/home/getDataReportTranspoled", {
                    params,
                });

                if (Array.isArray(response.data)) {
                    setDataToShow(response.data);
                } else if (Array.isArray(response.data.dataReport)) {
                    setDataToShow(response.data.dataReport);
                } else {
                    console.warn("useHome.getData: formato inesperado:", response.data);
                    setDataToShow([]);
                }

                // Guardar filtros para refresh posterior
                lastFiltersRef.current = { companyTypeId, userId };
            } catch (error) {
                console.error("useHome.getData error:", error);
                message.error(`Error al obtener los datos: ${error.message || error}`);
            } finally {
                setIsLoading(false);
            }
        },
        [setDataToShow, setIsLoading]
    );

    const deleteRegistro = useCallback(async (id) => {
        try {
            await api.put(`/home/deleteRegistro/${id}`);
        } catch (error) {
            console.error("Error en deleteRegistro:", error);
            throw error;
        }
    }, []);

    /**
     * Vuelve a obtener datos usando los filtros guardados y la compañía actual.
     */
    const refreshData = useCallback(async () => {
        const { companyTypeId, userId: lastUserId } = lastFiltersRef.current;
        // usar auth.id si está, si no, el último usado
        const userId = auth?.id ?? lastUserId ?? null;
        await getData(selectedCompanyId, companyTypeId, userId);
    }, [getData, auth?.id, selectedCompanyId]);

    /**
     * DEVOLVER registros (bulk) — acepta IDs explícitos.
     * @param {number} companyId
     * @param {string} notes
     * @param {number[]} ids lista de DataReportId habilitados para devolver
     */
    const sendDataToReturn = useCallback(
        async (companyId, notes = "", ids = []) => {
            try {
                const response = await api.put(`/home/sendDataToReturn/${companyId}`, {
                    notes,
                    ids, // <<--- importante: enviar los ids habilitados
                });

                if (response.data.code === 400) {
                    message.open({
                        type: "error",
                        content: response.data.message,
                        duration: 10,
                        style: { fontSize: "13px", padding: "16px 24px", fontWeight: "bold" },
                    });
                } else {
                    message.open({
                        type: "success",
                        content: response.data.message,
                        duration: 10,
                        style: { fontSize: "13px", padding: "16px 24px", fontWeight: "bold" },
                    });
                }

                await refreshData();
            } catch (error) {
                console.error("Error en sendDataToReturn:", error);
                throw error;
            }
        },
        [refreshData]
    );

    /**
     * ENVIAR registros (bulk) — acepta IDs explícitos.
     * @param {number} companyId
     * @param {number[]} ids lista de DataReportId habilitados para enviar
     */
    const sendDataForward = useCallback(async (companyId, ids = []) => {
        try {
            const response = await api.put(`/home/sendDataToForward/${companyId}`, { ids });

            if (response.data.code === 400) {
                message.open({
                    type: 'error',
                    content: response.data.message,
                    duration: 10,
                    style: { fontSize: '13px', padding: '16px 24px', fontWeight: 'bold' }
                });
            } else {
                message.open({
                    type: 'success',
                    content: response.data.message,
                    duration: 10,
                    style: { fontSize: '13px', padding: '16px 24px', fontWeight: 'bold' }
                });
            }

            await refreshData();
        } catch (error) {
            console.error("Error en sendDataForward:", error);
            throw error;
        }
    }, [refreshData]);

    const getDataReportLog = useCallback(
        async (dataReportId, opts = {}) => {
            const { asArray = true } = opts;
            if (!dataReportId || Number.isNaN(Number(dataReportId))) {
                message.warning("ID de registro inválido para el historial.");
                return {
                    dataReportId: Number(dataReportId) || null,
                    fechaInicio: null,
                    fechaFin: null,
                    cantMovimientos: 0,
                    items: [],
                    raw: null,
                };
            }

            try {
                setIsLoading(true);

                // 1) Intento estilo REST por parámetro
                try {
                    const { data } = await api.get(`/home/getDataReportLog/${dataReportId}`, {
                        params: { asArray },
                    });
                    const normalized = normalizeLogResponse(data, asArray);
                    return normalized;
                } catch (err) {
                    // 2) Fallback: estilo querystring
                    if (err?.response?.status !== 404) throw err;
                    const { data } = await api.get(`/home/getDataReportLog`, {
                        params: { dataReportId, asArray },
                    });
                    const normalized = normalizeLogResponse(data, asArray);
                    return normalized;
                }
            } catch (error) {
                console.error("Error en getDataReportLog:", error);
                message.error(
                    `Error al obtener el historial: ${error?.response?.data?.message || error.message || error
                    }`
                );
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [setIsLoading]
    );

    // --- helper local para normalizar la respuesta del backend ---
    function normalizeLogResponse(data, asArray) {
        const row =
            Array.isArray(data) && data.length === 1
                ? data[0]
                : data;

        const dataReportId =
            row?.dataReportId ?? row?.DataReportId ?? row?.data?.DataReportId ?? null;
        const fechaInicio = row?.fechaInicio ?? row?.FechaInicio ?? null;
        const fechaFin = row?.fechaFin ?? row?.FechaFin ?? null;
        const cantMovimientos =
            row?.cantMovimientos ?? row?.CantMovimientos ?? 0;

        let items = Array.isArray(row?.recorridoItemsArray)
            ? row.recorridoItemsArray
            : [];

        if (asArray && items.length === 0 && typeof row?.recorridoItems === "string") {
            items = row.recorridoItems
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
        }

        return {
            dataReportId,
            fechaInicio,
            fechaFin,
            cantMovimientos: Number(cantMovimientos) || items.length || 0,
            items,
            raw: row,
        };
    }

    return {
        getCompaniesByUser,
        getCountriesByUser,
        getAllCompanyTypes,
        getData,
        refreshData,
        deleteRegistro,
        sendDataForward,     // <-- ahora acepta (companyId, ids[])
        sendDataToReturn,    // <-- ahora acepta (companyId, notes, ids[])
        getDataReportLog,
        companies,
        companyTypes,
        countries,
        dataToShow,
        isLoading,
    };
};

export default useHome;




