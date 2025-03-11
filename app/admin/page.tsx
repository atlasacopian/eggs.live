"use client"

import { useState } from "react"

export default function AdminPage() {
  const [status, setStatus] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  async function cleanupData(endpoint: string, action: string) {
    try {
      setIsLoading(true)
      setStatus(`${action}...`)

      const response = await fetch(endpoint, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setStatus(`Success! ${data.message || "Operation completed"}`)
      } else {
        setStatus(`Error: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("API Error:", error)
      setStatus(`Error: Failed to complete operation. Please check console for details.`)
    } finally {
      setIsLoading(false)
    }
  }

  async function triggerScraper(endpoint: string, action: string) {
    try {
      setIsLoading(true)
      setStatus(`${action}...`)

      const response = await fetch(endpoint, {
        method: "POST",
      })

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          setStatus(`Error: ${errorJson.error || "Failed to scrape prices"}`)
        } catch {
          setStatus(`Error: ${errorText || "Failed to scrape prices"}`)
        }
        return
      }

      const data = await response.json()

      if (data.success) {
        if (endpoint.includes("scrape-la")) {
          setStatus(`Success! Scraped ${data.storeCount} LA stores on ${data.date}`)
        } else {
          setStatus(`Success! Scraped ${data.scrapedCount} prices on ${data.date}`)
        }
      } else {
        setStatus(`Error: ${data.error || "Failed to scrape prices"}`)
      }
    } catch (error) {
      console.error("Scraping Error:", error)
      setStatus(`Error: Failed to scrape prices. Please check console for details.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#00ff00",
        fontFamily: "monospace",
        padding: "40px 20px",
        minHeight: "100vh",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "30px" }}>EGGS.LIVE ADMIN</h1>

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "30px",
          border: "1px solid #00ff00",
          borderRadius: "4px",
          backgroundColor: "rgba(0, 255, 0, 0.05)",
        }}
      >
        <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>DATABASE CLEANUP</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button
            onClick={() => cleanupData("/api/remove-costco", "Removing Costco data")}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? "#333" : "#000",
              color: "#00ff00",
              border: "1px solid #00ff00",
              padding: "12px 24px",
              fontSize: "18px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "CLEANING..." : "REMOVE COSTCO DATA"}
          </button>

          <button
            onClick={() => cleanupData("/api/remove-test-data", "Removing test data")}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? "#333" : "#000",
              color: "#00ff00",
              border: "1px solid #00ff00",
              padding: "12px 24px",
              fontSize: "18px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "CLEANING..." : "REMOVE TEST DATA"}
          </button>

          <button
            onClick={() => triggerScraper("/api/scrape-now", "Scraping all stores")}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? "#333" : "#000",
              color: "#00ff00",
              border: "1px solid #00ff00",
              padding: "12px 24px",
              fontSize: "18px",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "20px",
            }}
          >
            {isLoading ? "SCRAPING..." : "SCRAPE ALL STORES"}
          </button>

          <button
            onClick={() => triggerScraper("/api/scrape-la", "Scraping LA stores")}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? "#333" : "#000",
              color: "#00ff00",
              border: "1px solid #00ff00",
              padding: "12px 24px",
              fontSize: "18px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "SCRAPING..." : "SCRAPE LA STORES"}
          </button>
        </div>

        {status && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              border: "1px solid #00ff00",
              borderRadius: "4px",
              backgroundColor: "rgba(0, 255, 0, 0.1)",
            }}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  )
}

