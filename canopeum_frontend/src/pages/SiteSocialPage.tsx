import { AuthenticationContext } from '@components/context/AuthenticationContext'
import SiteSocialHeader from '@components/social/SiteSocialHeader'
import type { PageViewMode } from '@models/types/PageViewMode.Type'
import type { Post, SiteSocial } from '@services/api'
import getApiClient from '@services/apiInterface'
import { ensureError } from '@services/errors'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import AnnouncementCard from '../components/AnnouncementCard'
import ContactCard from '../components/ContactCard'
import CreatePostWidget from '../components/CreatePostWidget'
import PostWidget from '../components/social/PostWidget'
import usePostsStore from '../store/postsStore'
import LoadingPage from './LoadingPage'

const SiteSocialPage = () => {
  const { siteId: siteIdParam } = useParams()
  const { currentUser } = useContext(AuthenticationContext)
  const { posts, setPosts, addPost } = usePostsStore()

  const [isLoadingSite, setIsLoadingSite] = useState(true)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [site, setSite] = useState<SiteSocial>()
  const [sitePosts, setSitePosts] = useState<Post[]>([])

  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [errorPosts, setErrorPosts] = useState<Error | undefined>(undefined)

  const siteId = siteIdParam
    ? Number.parseInt(siteIdParam, 10) || 0
    : 0

  const viewMode: PageViewMode = currentUser
    ? (currentUser.role === 'MegaAdmin' || currentUser.adminSiteIds.includes(siteId))
      ? 'admin'
      : 'user'
    : 'visitor'

  const fetchSiteData = async (parsedSiteId: number) => {
    setIsLoadingSite(true)
    try {
      const fetchedSite = await getApiClient().siteClient.social(parsedSiteId)
      setSite(fetchedSite)
    } catch (error_: unknown) {
      setError(ensureError(error_))
    } finally {
      setIsLoadingSite(false)
    }
  }

  const fetchPosts = useCallback(async (parsedSiteId: number) => {
    setIsLoadingPosts(true)
    try {
      const fetchedPosts = await getApiClient().postClient.all([parsedSiteId])
      setPosts(fetchedPosts)
    } catch (error_: unknown) {
      setErrorPosts(ensureError(error_))
    } finally {
      setIsLoadingPosts(false)
    }
  }, [setPosts])

  const addNewPost = (newPost: Post) => addPost(newPost)

  useEffect((): void => {
    void fetchSiteData(siteId)
    void fetchPosts(siteId)
  }, [siteId, fetchPosts])

  useEffect(
    () => setSitePosts(posts.filter(post => post.site.id === siteId)),
    [posts, siteId],
  )

  if (isLoadingSite) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <div className='bg-cream rounded-2 2 py-2'>
        <p>{error.message}</p>
      </div>
    )
  }

  if (!site) return <div />

  return (
    <div className='page-container mt-2 d-flex flex-column gap-4'>
      <div className='row m-0'>
        <div className='col-12'>
          <SiteSocialHeader site={site} viewMode={viewMode} />
        </div>
      </div>

      <div className='row row-gap-3 m-0'>
        <div className='col-12 col-md-6 col-lg-5 col-xl-4'>
          <div className='d-flex flex-column gap-4'>
            <AnnouncementCard announcement={site.announcement} viewMode={viewMode} />
            <ContactCard contact={site.contact} viewMode={viewMode} />
          </div>
        </div>

        <div className='col-12 col-md-6 col-lg-7 col-xl-8'>
          <div className='rounded-2 d-flex flex-column gap-4'>
            {viewMode === 'admin' && <CreatePostWidget addNewPost={addNewPost} siteId={siteId} />}
            <div className='d-flex flex-column gap-4'>
              {isLoadingPosts
                ? (
                  <div className='bg-cream rounded-2 2 py-2'>
                    <p>Loading...</p>
                  </div>
                )
                : errorPosts
                ? (
                  <div className='bg-cream rounded-2 2 py-2'>
                    <p>{errorPosts.message}</p>
                  </div>
                )
                : sitePosts.map(post => <PostWidget key={post.id} post={post} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default SiteSocialPage
