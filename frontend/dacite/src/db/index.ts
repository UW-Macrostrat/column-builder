import { useEffect, useCallback, useState } from "react";
import {
  PostgrestClient,
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
} from "@supabase/postgrest-js";

let pg = new PostgrestClient("http://localhost:3001");

/**
 * Fetch data using postgrestclient
 * @param query : A postgrest-js query builder object
 */
function usePostgrest(
  query: PostgrestQueryBuilder<any> | PostgrestFilterBuilder<any>
) {
  const [result, setResult] = useState<any>(); // cop-out type for now

  const getData = useCallback(async () => {
    const { data, error } = await query;
    if (error) {
      console.error(error);
    } else {
      setResult(data);
    }
  }, [query]);

  useEffect(() => {
    getData();
  }, []);

  return result;
}

export default pg;
export { usePostgrest };
