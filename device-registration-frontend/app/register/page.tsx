'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface DeviceDetail {
  key: string
  value: string
}

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetail[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const address = searchParams.get('address')
    const details = searchParams.get('details')

    if (address) {
      setWalletAddress(address)
    }

    if (details) {
      try {
        const decoded = decodeURIComponent(details)
        const parsed = decoded.split('\n').map(line => {
          const [key, ...valueParts] = line.split(':')
          return {
            key: key.trim(),
            value: valueParts.join(':').trim()
          }
        }).filter(item => item.key && item.value)
        setDeviceDetails(parsed)
      } catch (error) {
        console.error('Error parsing device details:', error)
      }
    }
  }, [searchParams])

  const handleSubmit = async () => {
    if (!walletAddress) {
      setErrorMessage('Wallet address is missing')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Format device details as newline-separated string
      const metadata = deviceDetails.map(d => `${d.key}: ${d.value}`).join('\n')

      const response = await fetch('/api/submit-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          metadata: metadata,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a duplicate device error
        if (response.status === 409 || data.code === 'DEVICE_EXISTS') {
          const errorMsg = 'Device already exists'
          setErrorMessage(errorMsg)
          setSubmitStatus('error')
          // Show alert popup
          alert('Device already exists')
          return
        } else {
          setErrorMessage(data.error || 'Failed to submit device')
        }
        throw new Error(data.error || 'Failed to submit device')
      }

      setSubmitStatus('success')
    } catch (error) {
      console.error('Error submitting device:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit device')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      maxWidth: '600px',
      width: '100%',
      background: 'white',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    }}>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#1a1a1a',
      }}>
        i-Witness Device Registration
      </h1>
      <p style={{
        color: '#666',
        marginBottom: '32px',
        fontSize: '14px',
      }}>
        Review and submit your device details
      </p>

      {walletAddress && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: '8px',
        }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#666',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Wallet Address
          </label>
          <code style={{
            display: 'block',
            fontSize: '14px',
            color: '#1a1a1a',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
          }}>
            {walletAddress}
          </code>
        </div>
      )}

      {deviceDetails.length > 0 && (
        <div style={{
          marginBottom: '24px',
        }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#666',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Device Details
          </label>
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            {deviceDetails.map((detail, index) => (
              <div
                key={index}
                style={{
                  padding: '12px 16px',
                  borderBottom: index < deviceDetails.length - 1 ? '1px solid #e0e0e0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#333',
                  minWidth: '140px',
                }}>
                  {detail.key}:
                </span>
                <span style={{
                  fontSize: '13px',
                  color: '#666',
                  textAlign: 'right',
                  flex: 1,
                  wordBreak: 'break-word',
                }}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitStatus === 'success' && (
        <div style={{
          padding: '16px',
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#155724',
        }}>
          ✓ Device registered successfully!
        </div>
      )}

      {submitStatus === 'error' && (
        <div style={{
          padding: '16px',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#721c24',
        }}>
          ✗ {errorMessage || 'Failed to register device'}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !walletAddress}
        style={{
          width: '100%',
          padding: '14px',
          background: isSubmitting || !walletAddress ? '#ccc' : '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: isSubmitting || !walletAddress ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Device'}
      </button>

      {!walletAddress && (
        <p style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#999',
          textAlign: 'center',
        }}>
          Missing wallet address. Please scan the QR code or use the registration URL.
        </p>
      )}
    </div>
  )
}

