import SiteCoordinates from '@components/analytics/site-modal/SiteCoordinates'
import SiteImageUpload from '@components/analytics/site-modal/SiteImageUpload'
import { LanguageContext } from '@components/context/LanguageContext'
import TreeSpeciesSelector from '@components/TreeSpeciesSelector'
import useApiClient from '@hooks/ApiClientHook'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import type { Sitetreespecies, SiteType, TreeType } from '@services/api'
import { getApiBaseUrl } from '@services/apiSettings'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  readonly open: boolean,
  readonly handleClose: (
    reason?: 'backdropClick' | 'escapeKeyDown' | 'save',
    data?: SiteDto,
  ) => void,
  readonly siteId: number | undefined,
}

export type SiteDto = {
  siteName?: string,
  siteType?: number,
  siteImage?: File,
  dmsLatitude: {
    degrees?: number,
    minutes?: number,
    seconds?: number,
    miliseconds?: number,
    cardinal?: string,
  },
  dmsLongitude: {
    degrees?: number,
    minutes?: number,
    seconds?: number,
    miliseconds?: number,
    cardinal?: string,
  },
  presentation?: string,
  size?: number,
  species: Sitetreespecies[],
  researchPartner?: boolean,
  visibleOnMap?: boolean,
}

const defaultSiteDto: SiteDto = {
  dmsLatitude: {
    cardinal: 'N',
  },
  dmsLongitude: {
    cardinal: 'W',
  },
  species: [],
  researchPartner: true,
  visibleOnMap: true,
}

const extractCoordinate = (coordinates?: string) => {
  if (!coordinates) return {}

  const char1 = coordinates.indexOf('°')
  const char2 = coordinates.indexOf("'")
  const char3 = coordinates.indexOf('.')
  const char4 = coordinates.indexOf('"')

  return {
    degrees: Number(coordinates.slice(0, char1)),
    minutes: Number(coordinates.slice(char1 + 1, char2)),
    seconds: Number(coordinates.slice(char2 + 1, char3)),
    miliseconds: Number(coordinates.slice(char3 + 1, char4)),
    cardinal: coordinates.at(-1),
  }
}

const SiteModal = ({ open, handleClose, siteId }: Props) => {
  const { t } = useTranslation()
  const { getApiClient } = useApiClient()
  const { translateValue } = useContext(LanguageContext)
  const [site, setSite] = useState<SiteDto>(defaultSiteDto)
  const [availableSpecies, setAvailableSpecies] = useState<TreeType[]>([])
  const [availableSiteTypes, setAvailableSiteTypes] = useState<SiteType[]>([])
  const [siteImageURL, setSiteImageURL] = useState<string>()

  const fetchSite = async () => {
    if (!siteId) return

    const siteDetail = await getApiClient().siteClient.detail(siteId)
    const dmsLat = siteDetail.coordinate.dmsLatitude
    const dmsLong = siteDetail.coordinate.dmsLongitude

    const imgResponse = await fetch(`${getApiBaseUrl()}${siteDetail.image.asset}`)
    const blob = await imgResponse.blob()

    setSite({
      siteName: siteDetail.name,
      siteType: siteDetail.siteType.id,
      siteImage: new File([blob], 'temp', { type: blob.type }),
      dmsLatitude: extractCoordinate(dmsLat),
      dmsLongitude: extractCoordinate(dmsLong),
      presentation: siteDetail.description,
      size: Number(siteDetail.size),
      species: siteDetail.siteTreeSpecies,
      researchPartner: siteDetail.researchPartnership,
      visibleOnMap: siteDetail.visibleMap,
    })
    setSiteImageURL(URL.createObjectURL(blob))
  }

  const fetchTreeSpecies = async () =>
    setAvailableSpecies(await getApiClient().treeClient.species())

  const fetchSiteTypes = async () => setAvailableSiteTypes(await getApiClient().siteClient.types())

  const onImageUpload = (file: File) => {
    setSite(value => ({ ...value, siteImage: file }))
    setSiteImageURL(URL.createObjectURL(file))
  }

  useEffect(() => {
    void fetchTreeSpecies()
    void fetchSiteTypes()
  }, [])

  useEffect(() => void fetchSite(), [open])

  useEffect(() => setSite(defaultSiteDto), [siteId])

  return (
    <Dialog fullWidth maxWidth='sm' onClose={(_, reason) => handleClose(reason)} open={open}>
      <DialogTitle>
        <div className='fs-5 text-capitalize m-auto text-center'>
          {t('analytics.site-modal.create-site')}
        </div>
      </DialogTitle>
      <DialogContent className='pb-5'>
        <form>
          <div className='mb-3'>
            <label className='form-label text-capitalize' htmlFor='site-name'>
              {t('analytics.site-modal.site-name')}
            </label>
            <input
              className='form-control'
              id='site-name'
              onChange={event => setSite(value => ({ ...value, siteName: event.target.value }))}
              type='text'
              value={site.siteName}
            />
          </div>
          <div className='mb-3'>
            <label className='form-label text-capitalize' htmlFor='site-type'>
              {t('analytics.site-modal.site-type')}
            </label>
            <select
              className='form-select'
              id='site-type'
              onChange={event =>
                setSite(current => ({ ...current, siteType: Number(event.target.value) }))}
              value={site.siteType}
            >
              {availableSiteTypes.map(value => (
                <option key={`available-specie-${value.id}`} value={value.id}>
                  {translateValue(value)}
                </option>
              ))}
            </select>
          </div>
          <div className='mb-3'>
            <label className='form-label text-capitalize' htmlFor='site-image'>
              {t('analytics.site-modal.site-type')}
            </label>
            <SiteImageUpload onChange={onImageUpload} siteImageURL={siteImageURL} />
          </div>
          <div className='mb-3'>
            <SiteCoordinates
              latitude={site.dmsLatitude}
              longitude={site.dmsLongitude}
              onChange={(latitude, longitude) =>
                setSite(current => ({
                  ...current,
                  dmsLatitude: latitude,
                  dmsLongitude: longitude,
                }))}
            />
          </div>
          <div className='mb-3'>
            <label className='form-label text-capitalize' htmlFor='site-presentation'>
              {t('analytics.site-modal.site-presentation')}
            </label>
            <textarea
              className='form-control'
              id='site-presentation'
              onChange={event => setSite(value => ({ ...value, presentation: event.target.value }))}
              value={site.presentation}
            />
          </div>
          <div className='mb-3'>
            <label className='form-label text-capitalize' htmlFor='site-size'>
              {t('analytics.site-modal.site-size')}
            </label>
            <div className='input-group'>
              <input
                className='form-control'
                id='site-size'
                onChange={event =>
                  setSite(value => ({ ...value, size: Number(event.target.value) }))}
                type='number'
                value={site.size}
              />
              <span className='input-group-text'>ft²</span>
            </div>
          </div>
          <div className='mb-3'>
            {availableSpecies.length > 0 &&
              (
                <TreeSpeciesSelector
                  onChange={species => setSite(current => ({ ...current, species }))}
                  searchBarLabel='analytics.site-modal.site-tree-species'
                  species={site.species}
                  speciesOptions={availableSpecies}
                />
              )}
          </div>
          <div className='mb-3'>
            <label className='form-label text-capitalize' htmlFor='site-research-partner'>
              {t('analytics.site-modal.site-research-partner')}
            </label>
            <div
              className='d-flex gap-1 align-items-center text-center justify-content-evenly'
              id='site-research-partner'
            >
              <div className='form-check form-check-inline'>
                <input
                  checked={!!site.researchPartner}
                  className='form-check-input'
                  id='research-partner-yes'
                  name='research-partner'
                  onChange={() => setSite(current => ({ ...current, researchPartner: true }))}
                  type='radio'
                  value='yes'
                />
                <label className='form-check-label' htmlFor='research-partner-yes'>
                  {t('analytics.site-modal.yes')}
                </label>
              </div>
              <div className='form-check form-check-inline'>
                <input
                  checked={!site.researchPartner}
                  className='form-check-input'
                  id='research-partner-no'
                  name='research-partner'
                  onChange={() => setSite(current => ({ ...current, researchPartner: false }))}
                  type='radio'
                  value='no'
                />
                <label className='form-check-label' htmlFor='research-partner-no'>
                  {t('analytics.site-modal.no')}
                </label>
              </div>
            </div>
          </div>
          <div className='mb-3'>
            <label className='form-label text-capitalize' htmlFor='site-map-visibility'>
              {t('analytics.site-modal.site-map-visibility')}
            </label>
            <div
              className='d-flex gap-1 align-items-center text-center justify-content-evenly'
              id='site-map-visibility'
            >
              <div className='form-check form-check-inline'>
                <input
                  checked={!!site.visibleOnMap}
                  className='form-check-input'
                  id='map-visible'
                  name='map-visibility'
                  onChange={() => setSite(current => ({ ...current, visibleOnMap: true }))}
                  type='radio'
                  value='visible'
                />
                <label className='form-check-label' htmlFor='map-visible'>
                  {t('analytics.site-modal.visible')}
                </label>
              </div>
              <div className='form-check form-check-inline'>
                <input
                  checked={!site.visibleOnMap}
                  className='form-check-input'
                  id='map-invisible'
                  name='map-visibility'
                  onChange={() => setSite(current => ({ ...current, visibleOnMap: false }))}
                  type='radio'
                  value='invisible'
                />
                <label className='form-check-label' htmlFor='map-invisible'>
                  {t('analytics.site-modal.invisible')}
                </label>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
      <DialogActions>
        <button
          className='btn btn-outline-primary'
          onClick={() => handleClose()}
          type='button'
        >
          Cancel
        </button>
        <button className='btn btn-primary' onClick={() => handleClose('save', site)} type='button'>
          Subscribe
        </button>
      </DialogActions>
    </Dialog>
  )
}
export default SiteModal
