import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

export default function useAdminResource(url) {
  const [state, setState] = useState({
    url: "",
    data: null,
    error: "",
    loading: true,
  });
  const sequence = useRef(0);
  const reload = useCallback(() => {
    const version = ++sequence.current;
    return api
      .get(url)
      .then((response) => {
        if (sequence.current === version)
          setState({ url, data: response.data, error: "", loading: false });
      })
      .catch((error) => {
        if (sequence.current === version)
          setState({
            url,
            data: null,
            error:
              error.response?.data?.message ||
              "Unable to load this view. Please try again.",
            loading: false,
          });
      });
  }, [url]);
  useEffect(() => {
    reload();
    return () => {
      sequence.current += 1;
    };
  }, [reload]);
  return { ...state, loading: state.loading || state.url !== url, reload };
}
