'use client';

import { useState, useEffect } from 'react';
import styles from './forumMonitoring.module.css';
import api from '@/lib/axios'
import { toast } from 'react-toastify';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorName: string;
  archived: boolean;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  topics?: string;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  authorName: string;
  archived: boolean;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
}

// SVG Icons
const Icons = {
  Upvote: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L3 15H9V20H15V15H21L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Downvote: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20L21 9H15V4H9V9H3L12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Comments: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Delete: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Filter: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Archive: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 8V21H3V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 3H23V8H1V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Restore: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 22C17.3137 22 20 19.3137 20 16C20 12.6863 17.3137 10 14 10C10.6863 10 8 12.6863 8 16C8 19.3137 10.6863 22 14 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 12V16L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 3V7H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 11C4 6.58172 7.58172 3 12 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

export default function ForumMonitoring() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['All', 'Teaching Methods', 'Student Management', 'Curriculum', 'Technology', 'General'];

  const fetchForumData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/forum/admin/posts');
      if (response.status === 200) {
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      toast.error('Failed to load forum posts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const response = await api.get(`/api/forum/admin/posts/comments/${postId}`);
      if (response.status === 200) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    }
  };

  useEffect(() => {
    fetchForumData();
  }, []);

  const filteredPosts = posts.filter(post => {
    const safeTitle = post.title?.toLowerCase() || '';
    const safeContent = post.content?.toLowerCase() || '';
    const safeSearchQuery = searchQuery.toLowerCase();
    
    const matchesSearch = safeTitle.includes(safeSearchQuery) || safeContent.includes(safeSearchQuery);
    const matchesCategory = selectedCategory === 'All' || post.topics === selectedCategory;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !post.archived) ||
                         (statusFilter === 'archived' && post.archived);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate counts
  const totalPosts = posts.length;
  const activePosts = posts.filter(p => !p.archived).length;
  const archivedPosts = posts.filter(p => p.archived).length;

  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    await fetchComments(post.id);
  };

  const handleArchivePost = async (postId: string) => {
    try {
      const response = await api.patch(`/api/forum/admin/post/archive/${postId}`);
      if (response.status === 200) {
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, archived: true } : post
        ));
        toast.success('Post archived successfully');
      }
    } catch (error) {
      console.error('Error archiving post:', error);
      toast.error('Error archiving post');
    }
  };

  const handleRestorePost = async (postId: string) => {
    try {
      const response = await api.patch(`/api/forum/admin/post/restore/${postId}`);
      if (response.status === 200) {
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, archived: false } : post
        ));
        toast.success('Post restored successfully');
      }
    } catch (error) {
      console.error('Error restoring post:', error);
      toast.error('Error restoring post');
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      const response = await api.delete(`/api/forum/admin/post/delete/${postToDelete}`);
      if (response.status === 200) {
        setPosts(prev => prev.filter(post => post.id !== postToDelete));
        if (selectedPost?.id === postToDelete) {
          setSelectedPost(null);
          setShowCommentsModal(false);
        }
        setShowDeleteModal(false);
        setPostToDelete(null);
        toast.success('Post deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    }
  };

  const openDeleteModal = (postId: string) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown time';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getVoteScore = (upvotes: number, downvotes: number) => {
    return upvotes - downvotes;
  };

  const getStatusBadge = (archived: boolean) => {
    return archived 
      ? <span className={styles.statusArchived}>Archived</span>
      : <span className={styles.statusActive}>Active</span>;
  };

  // Component for displaying comments
  const CommentItem = ({ comment }: { comment: Comment }) => {
    const handleArchiveComment = async (commentId: string) => {
      try {
        const response = await api.patch(`/api/forum/admin/comment/archive/${commentId}`);
        if (response.status === 200) {
          setComments(prev => prev.map(c => 
            c.id === commentId ? { ...c, archived: true } : c
          ));
          toast.success('Comment archived successfully');
        }
      } catch (error) {
        console.error('Error archiving comment:', error);
        toast.error('Error archiving comment');
      }
    };

    const handleRestoreComment = async (commentId: string) => {
      try {
        const response = await api.patch(`/api/forum/admin/comment/restore/${commentId}`);
        if (response.status === 200) {
          setComments(prev => prev.map(c => 
            c.id === commentId ? { ...c, archived: false } : c
          ));
          toast.success('Comment restored successfully');
        }
      } catch (error) {
        console.error('Error restoring comment:', error);
        toast.error('Error restoring comment');
      }
    };

    const handleDeleteComment = async (commentId: string) => {
      try {
        const response = await api.delete(`/api/forum/admin/comment/delete/${commentId}`);
        if (response.status === 200) {
          setComments(prev => prev.filter(c => c.id !== commentId));
          toast.success('Comment deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        toast.error('Error deleting comment');
      }
    };
    
    return (
      <div className={styles.comment}>
        <div className={styles.commentContent}>
          <div className={styles.commentHeader}>
            <span className={styles.commentAuthor}>{comment.authorName}</span>
            <span className={styles.commentTime}>
              {formatTimeAgo(comment.createdAt)}
            </span>
            {getStatusBadge(comment.archived)}
          </div>
          
          <p className={styles.commentText}>{comment.content}</p>
          
          <div className={styles.commentFooter}>
            <div className={styles.voteSection}>
              <span className={styles.voteCount}>
                {getVoteScore(comment.upvotes, comment.downvotes)} votes
              </span>
              <span className={styles.commentCount}>
                {comment.commentsCount || 0} replies
              </span>
            </div>

            <div className={styles.commentActions}>
              {!comment.archived ? (
                <button 
                  className={styles.actionBtn}
                  onClick={() => handleArchiveComment(comment.id)}
                >
                  <Icons.Archive />
                  Archive
                </button>
              ) : (
                <button 
                  className={styles.actionBtn}
                  onClick={() => handleRestoreComment(comment.id)}
                >
                  <Icons.Restore />
                  Restore
                </button>
              )}
              <button 
                className={styles.deleteBtn}
                onClick={() => handleDeleteComment(comment.id)}
              >
                <Icons.Delete />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleVotePost = async (postId: string, voteType: 'up' | 'down') => {
    try {
      const endpoint = voteType === 'up' 
        ? `/api/forum/posts/upvote/${postId}` 
        : `/api/forum/posts/downvote/${postId}`;
      
      await api.post(endpoint);
      
      // Refresh the post data to show updated vote counts
      await fetchForumData();
      
      // If modal is open, refresh the selected post
      if (selectedPost?.id === postId) {
        const updatedPost = posts.find(p => p.id === postId);
        if (updatedPost) {
          setSelectedPost(updatedPost);
        }
      }
      
      toast.success(`Post ${voteType}voted successfully`);
    } catch (error: any) {
      console.error('Error voting on post:', error);
      toast.error(error.response?.data?.error || `Failed to ${voteType}vote post`);
    }
  };

  return (
    <div className={styles.communityForum}>
      {/* Header Section - Not sticky */}
      <div className={styles.forumHeader}>
        <div className={styles.headerMain}>
          <div className={styles.headerTitle}>
            <h1>Community Forum Monitoring</h1>
            <p className={styles.headerSubtitle}>Admin dashboard for monitoring all community discussions</p>
          </div>
        </div>

        <div className={styles.forumControls}>
          <div className={styles.searchFilter}>
            <div className={styles.filterGroup}>
              <Icons.Filter />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.customSelect}>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.categoryFilter}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className={styles.selectArrow}>▼</div>
            </div>
            {/* Status Filter */}
            <div className={styles.customSelect}>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={styles.statusFilter}
              >
                <option value="all">All Posts</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <div className={styles.selectArrow}>▼</div>
            </div>
          </div>
          
          <div className={styles.adminStats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{totalPosts}</span>
              <span className={styles.statLabel}>Total Posts</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{activePosts}</span>
              <span className={styles.statLabel}>Active</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{archivedPosts}</span>
              <span className={styles.statLabel}>Archived</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.postsGrid}>
        {filteredPosts.map(post => (
          <div key={post.id} className={styles.postCard}>
            <div className={styles.postContent}>
              <div className={styles.postHeader}>
                <div className={styles.postMeta}>
                  <span className={styles.postCategory}>{post.topics || 'General'}</span>
                  <span className={styles.postAuthor}>by {post.authorName}</span>
                  <span className={styles.postTime}>{formatTimeAgo(post.createdAt)}</span>
                  {getStatusBadge(post.archived)}
                </div>
                <h3 className={styles.postTitle}>{post.title}</h3>
              </div>
              
              <div className={styles.postBody}>
                <p className={styles.postPreview}>{post.content}</p>
              </div>

              <div className={styles.postFooter}>
                <div className={styles.postActions}>
                  {!post.archived ? (
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleArchivePost(post.id)}
                    >
                      <Icons.Archive />
                      Archive
                    </button>
                  ) : (
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleRestorePost(post.id)}
                    >
                      <Icons.Restore />
                      Restore
                    </button>
                  )}
                  <button 
                    className={styles.actionBtn}
                    onClick={() => openDeleteModal(post.id)}
                  >
                    <Icons.Delete />
                    Delete
                  </button>
                </div>
                
                <div className={styles.postRightActions}>
                  <button 
                    className={styles.commentsBtn}
                    onClick={() => handleOpenComments(post)}
                  >
                    <Icons.Comments />
                    {post.commentsCount || 0}
                  </button>
                  
                  <div className={styles.voteSection}>
                    <button 
                      className={`${styles.voteButton} ${styles.upvote}`}
                      onClick={() => handleVotePost(post.id, 'up')}
                    >
                      <Icons.Upvote />
                    </button>
                    <span className={styles.voteCount}>
                      {getVoteScore(post.upvotes, post.downvotes)}
                    </span>
                    <button 
                      className={`${styles.voteButton} ${styles.downvote}`}
                      onClick={() => handleVotePost(post.id, 'down')}
                    >
                      <Icons.Downvote />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className={styles.noPosts}>
            <p>No posts found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <div className={styles.confirmHeader}>
              <h3>Confirm Deletion</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete this post? This action cannot be undone.</p>
            </div>
            <div className={styles.confirmActions}>
              <button 
                className={styles.confirmDeleteBtn}
                onClick={handleDeletePost}
              >
                Delete
              </button>
              <button 
                className={styles.confirmCancelBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedPost && (
        <div className={styles.commentsModal}>
          <div className={styles.modalOverlay} onClick={() => setShowCommentsModal(false)} />
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Discussion Monitoring</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCommentsModal(false)}
              >
                <Icons.Close />
              </button>
            </div>
            
            <div className={styles.modalSplitView}>
              <div className={styles.postSidebar}>
                <div className={styles.postCardDetailed}>
                  <div className={styles.postHeader}>
                    <div className={styles.postMeta}>
                      <span className={styles.postCategory}>{selectedPost.topics || 'General'}</span>
                      <span className={styles.postAuthor}>by {selectedPost.authorName}</span>
                      <span className={styles.postTime}>{formatTimeAgo(selectedPost.createdAt)}</span>
                      {getStatusBadge(selectedPost.archived)}
                    </div>
                  </div>
                  
                  <h3 className={styles.postTitle}>{selectedPost.title}</h3>
                  <div className={styles.postContentDetailed}>
                    {selectedPost.content}
                  </div>
                  
                  <div className={styles.postStats}>
                    <div className={styles.statGroup}>
                      <div className={styles.statItem}>
                        <Icons.Comments />
                        <span>{selectedPost.commentsCount || 0} comments</span>
                      </div>
                      <div className={styles.voteSection}>
                        <button 
                          className={`${styles.voteButton} ${styles.upvote}`}
                          onClick={() => handleVotePost(selectedPost.id, 'up')}
                        >
                          <Icons.Upvote />
                        </button>
                        <span className={styles.voteCount}>
                          {getVoteScore(selectedPost.upvotes, selectedPost.downvotes)}
                        </span>
                        <button 
                          className={`${styles.voteButton} ${styles.downvote}`}
                          onClick={() => handleVotePost(selectedPost.id, 'down')}
                        >
                          <Icons.Downvote />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.adminActions}>
                    {!selectedPost.archived ? (
                      <button 
                        className={styles.archiveBtn}
                        onClick={() => handleArchivePost(selectedPost.id)}
                      >
                        <Icons.Archive />
                        Archive Post
                      </button>
                    ) : (
                      <button 
                        className={styles.restoreBtn}
                        onClick={() => handleRestorePost(selectedPost.id)}
                      >
                        <Icons.Restore />
                        Restore Post
                      </button>
                    )}
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => openDeleteModal(selectedPost.id)}
                    >
                      <Icons.Delete />
                      Delete Post
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.commentsSidebar}>
                <div className={styles.commentSection}>
                  <div className={styles.commentsList}>
                    <h4 className={styles.commentsTitle}>
                      {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                    </h4>
                    <div className={styles.commentsContainer}>
                      {comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))}
                      
                      {comments.length === 0 && (
                        <div className={styles.noComments}>
                          <p>No comments yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}