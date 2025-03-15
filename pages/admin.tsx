import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

interface StoreData {
  id: number;
  name: string;
  locations: number;
}

interface ScrapingResult {
  store: string;
  zipCode: string;
  count: number;
  success: boolean;
  error?: string;
}

export default function AdminPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [scrapingResults, setScrapingResults] = useState<ScrapingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('stores');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stores');
      const data = await response.json();
      
      if (data.success) {
        setStores(data.stores || []);
      } else {
        setError(data.message || 'Failed to fetch stores');
      }
    } catch (err) {
      setError('An error occurred while fetching stores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runScraper = async (type: 'sample' | 'full') => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = type === 'sample' ? '/api/cron/scrape-la-sample' : '/api/cron/scrape-la-full';
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setScrapingResults(data.results || []);
        setActiveTab('results');
      } else {
        setError(data.message || 'Failed to run scraper');
      }
    } catch (err) {
      setError('An error occurred while running the scraper');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all egg price data? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/clear-data', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        alert('Database cleared successfully');
      } else {
        setError(data.message || 'Failed to clear database');
      }
    } catch (err) {
      setError('An error occurred while clearing the database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Admin Dashboard | eggs.live</title>
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Link href="/">
            <button className="px-4 py-2 border rounded hover:bg-gray-100">Back to Home</button>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Scraper Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => runScraper('sample')}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Run Sample Scrape
            </button>
            <button
              onClick={() => runScraper('full')}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Run Full Scrape
            </button>
            <button
              onClick={clearDatabase}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Clear Database
            </button>
          </div>
          
          {loading && <p className="mt-4 text-gray-600">Loading...</p>}
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="border-b mb-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('stores')}
                className={`pb-2 px-1 ${activeTab === 'stores' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
              >
                Stores
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`pb-2 px-1 ${activeTab === 'results' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
              >
                Scraping Results
              </button>
            </div>
          </div>
          
          {activeTab === 'stores' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Store Data</h2>
              {stores.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locations</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stores.map((store) => (
                        <tr key={store.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{store.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{store.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{store.locations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No stores found.</p>
              )}
            </div>
          )}
          
          {activeTab === 'results' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Scraping Results</h2>
              {scrapingResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ZIP Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scrapingResults.map((result, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.store}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.zipCode}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.count}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {result.success ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Success
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Failed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No scraping results available. Run a scraper to see results.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
