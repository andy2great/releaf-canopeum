import { SnackbarContext } from '@components/context/SnackbarContext'
import MultipleSelectChip, { type SelectionItem } from '@components/inputs/MultipleSelectChip'
import { APP_CONFIG } from '@config/config'
import { ERROR_MESSAGES } from '@constants/errorMessages'
import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import { ApiException, CreateUserInvitation } from '@services/api'
import getApiClient from '@services/apiInterface'
import { type InputValidationError, isValidEmail } from '@utils/validators'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  readonly open: boolean,
  readonly handleClose: () => void,
}

const AdminInvitationDialog = ({ open, handleClose }: Props) => {
  const { t: translate } = useTranslation()
  const { openAlertSnackbar } = useContext(SnackbarContext)

  const [siteOptions, setSiteOptions] = useState<SelectionItem<number>[]>([])
  const [invitationLink, setInvitationLink] = useState<string>()

  const [email, setEmail] = useState('')
  const [siteIds, setSiteIds] = useState<number[]>([])

  const [emailError, setEmailError] = useState<InputValidationError | undefined>()
  const [generateLinkError, setGenerateLinkError] = useState<string>()

  const fetchAllSites = async () => {
    const sites = await getApiClient().siteClient.all()
    setSiteOptions(sites.map(site => ({ displayText: site.name, value: site.id })))
  }

  useEffect(() => void fetchAllSites(), [])

  const validateEmail = () => {
    if (!email) {
      setEmailError('required')

      return false
    }

    if (!isValidEmail(email)) {
      setEmailError('email')

      return false
    }

    setEmailError(undefined)

    return true
  }

  const validateForm = () =>
    // Do not return directly the method calls;
    // we need each of them to be called before returning the result
    validateEmail()

  const handleGenerateLinkClick = async () => {
    const isFormValid = validateForm()
    if (!isFormValid) return

    try {
      const createUserInvitation = new CreateUserInvitation({
        email,
        siteIds,
      })
      const response = await getApiClient().userInvitationClient.create(createUserInvitation)

      setInvitationLink(`${APP_CONFIG.appBaseUrl}/register?code=${response.code}`)
    } catch (error: unknown) {
      if (
        error instanceof ApiException &&
        error.response.replaceAll('"', '') === ERROR_MESSAGES.emailTaken
      ) {
        setGenerateLinkError(translate('settings.manage-admins.email-taken'))
      } else {
        setGenerateLinkError(translate('settings.manage-admins.generate-link-error'))
      }
    }
  }

  const handleCopyLinkClick = () => {
    if (!invitationLink) return

    void navigator.clipboard.writeText(invitationLink)
    openAlertSnackbar(`${translate('generic.copied-clipboard')}!`, { severity: 'info' })
  }

  const onCloseModal = () => {
    // Reset all fields before closing the modal
    setInvitationLink(undefined)
    setEmail('')
    setSiteIds([])
    setEmailError(undefined)
    setGenerateLinkError(undefined)

    handleClose()
  }

  const renderInvitationContent = () => {
    if (invitationLink) {
      return (
        <div className='d-flex flex-column gap-4'>
          <span className='text-primary text-decoration-underline'>{invitationLink}</span>

          <div>
            <span>{translate('settings.manage-admins.copy-link-message')}</span>
            <span className='ms-1 fw-bold'>{email}</span>
          </div>
        </div>
      )
    }

    return (
      <div className='w-100'>
        <div className='w-100'>
          <label htmlFor='email-input'>{translate('auth.email-label')}</label>
          <input
            aria-describedby='email'
            className={`form-control ${emailError && 'is-invalid'} `}
            id='email-input'
            onBlur={() => validateEmail()}
            onChange={event => setEmail(event.target.value)}
            type='email'
          />
          {emailError === 'required' && (
            <span className='help-block text-danger'>
              {translate('auth.email-error-required')}
            </span>
          )}
          {emailError === 'email' && (
            <span className='help-block text-danger'>
              {translate('auth.email-error-format')}
            </span>
          )}
        </div>

        <MultipleSelectChip
          classes='mt-4'
          label={`${translate('settings.manage-admins.assign-to-label')}*`}
          onChange={ids => setSiteIds(ids)}
          options={siteOptions}
        />

        {generateLinkError && (
          <div className='mt-3'>
            <span className='help-block text-danger'>{generateLinkError}</span>
          </div>
        )}
      </div>
    )
  }

  const renderActionButton = () => {
    if (invitationLink) {
      return (
        <button
          className='btn btn-primary'
          onClick={handleCopyLinkClick}
          type='button'
        >
          {translate('settings.manage-admins.copy-link')}
        </button>
      )
    }

    return (
      <button
        className='btn btn-primary'
        onClick={handleGenerateLinkClick}
        type='button'
      >
        {translate('settings.manage-admins.generate-link')}
      </button>
    )
  }

  return (
    <Dialog fullWidth maxWidth='sm' onClose={onCloseModal} open={open}>
      <DialogTitle className='text-center'>
        {translate('settings.manage-admins.invite-admin')}
      </DialogTitle>
      <DialogContent>
        <div className='d-flex flex-column justify-content-between m-auto' style={{ width: '80%' }}>
          {renderInvitationContent()}

          <div className='mt-5 d-flex justify-content-between align-items-center'>
            <button
              className='btn btn-outline-primary'
              onClick={onCloseModal}
              type='button'
            >
              {translate('generic.cancel')}
            </button>

            {renderActionButton()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdminInvitationDialog
