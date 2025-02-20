// pages/get-data.tsx
import axios from '@/api/axios';
import React, { useEffect, useState } from 'react';

// Define a type for the data you expect from the API
interface DataType {
  id: number;
  name: string;
  description: string;
}

// Define your component
const Invoices = () => {
  // Define state with the appropriate types
  const [data, setData] = useState<DataType[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data when the component mounts
    const fetchData = async () => {
      try {
        const response = await axios.get<DataType[]>(
          'http://localhost:8080/public/expense-invoice'
        );
        setData(response.data); // Store the response data
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : 'Error fetching data');
      } finally {
        setLoading(false); // Turn off loading state
      }
    };

    fetchData();
  }, []); // Empty dependency array means it runs only once when the component mounts

  // Render loading, error, or data
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Data from NestJS API:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default Invoices;
