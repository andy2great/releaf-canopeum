import BatchTable from '@components/analytics/BatchTable'
import SiteSuccessRatesChart from '@components/analytics/SiteSuccessRatesChart'
import SiteSummaryCard from '@components/analytics/SiteSummaryCard'
import { AuthenticationContext } from '@components/context/AuthenticationContext'
import { LanguageContext } from '@components/context/LanguageContext'
import useApiClient from '@hooks/ApiClientHook'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { SiteSummary, User } from '../services/api'

const Analytics = () => {
  const { t: translate } = useTranslation()
  const { formatDate } = useContext(LanguageContext)
  const { currentUser } = useContext(AuthenticationContext)
  const { getApiClient } = useApiClient()

  const [siteSummaries, setSiteSummaries] = useState<SiteSummary[]>([])
  const [adminList, setAdminList] = useState<User[]>([])

  const fetchSites = useCallback(
    async () => setSiteSummaries(await getApiClient().summaryClient.all()),
    [getApiClient],
  )

  const fetchAdmins = useCallback(
    async () => setAdminList(await getApiClient().userClient.allSiteManagers()),
    [getApiClient],
  )

  useEffect((): void => {
    if (currentUser?.role !== 'MegaAdmin') return

    void fetchAdmins()
  }, [currentUser?.role, fetchAdmins])

  useEffect(
    (): void => void fetchSites(),
    [fetchSites],
  )

  const renderBatches = () =>
    siteSummaries.map(site => {
      const lastModifiedBatchDate = site.batches.length > 0
        ? site
          .batches
          .map(batch => batch.updatedAt)
          .sort((a, b) =>
            a > b
              ? -1
              : 1
          )[0]
        : undefined

      return (
        <div className='accordion-item mb-3 rounded' key={site.id}>
          <h2 className='accordion-header rounded' id={`heading-${site.id}`}>
            <button
              aria-controls={`collapse-${site.id}`}
              aria-expanded='true'
              className='accordion-button collapsed rounded'
              data-bs-target={`#collapse-${site.id}`}
              data-bs-toggle='collapse'
              type='button'
            >
              <div className='d-flex justify-content-between w-100 pe-3 fs-5'>
                <span>{site.name}</span>
                <span style={{ opacity: .5 }}>
                  {translate('analytics.last-update')}: {lastModifiedBatchDate
                    ? formatDate(lastModifiedBatchDate)
                    : 'N/A'}
                </span>
                <span className='text-capitalize'>
                  {site.batches.length}{' '}
                  {translate('analytics.batches', { count: site.batches.length })}
                </span>
              </div>
            </button>
          </h2>

          <div
            aria-labelledby={`heading-${site.id}`}
            className='accordion-collapse collapse'
            data-bs-parent='#accordion-batches'
            id={`collapse-${site.id}`}
          >
            <div className='accordion-body'>
              <BatchTable batches={site.batches} />
            </div>
          </div>
        </div>
      )
    })

  return (
    <div>
      <div className='page-container d-flex flex-column gap-2'>
        <div className='d-flex justify-content-between'>
          <h1 className='text-light'>{translate('analytics.title')}</h1>

          <button className='btn btn-secondary' type='button'>
            {translate('analytics.create-site')}
          </button>
        </div>

        <div className='mt-2 row gx-3 gy-3 pb-3'>
          {siteSummaries.map(site => (
            <SiteSummaryCard
              admins={adminList}
              key={`site-${site.id}-card`}
              onSiteChange={setSiteSummaries}
              site={site}
            />
          ))}
        </div>

        <div className='mt-4 bg-cream rounded p-3'>
          <h5>{translate('analytics.success-rate-chart.title')}</h5>
          <SiteSuccessRatesChart siteSummaries={siteSummaries} />
        </div>

        <div className='mt-4'>
          <div className='bg-cream rounded p-3 px-4'>
            <div className='d-flex justify-content-between'>
              <div className='fs-5'>{translate('analytics.batches.batch-tracking')}</div>
              <div>
                <span>Filters Go Here</span>
              </div>
            </div>
          </div>

          <div className='accordion mt-4' id='accordion-batches'>
            {renderBatches()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
