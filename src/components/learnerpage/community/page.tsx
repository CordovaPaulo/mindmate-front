'use client';

import { useState, useEffect } from 'react';
import styles from './community.module.css';
import api from '@/lib/axios'
import { toast } from 'react-toastify';

interface Post {
  id: string; // MongoDB ObjectId as string
  title: string;
  content: string;
  author: string; // MongoDB ObjectId as string
  authorName: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  commentsCount: number; // backend uses commentsCount, not commentCount
  topics?: string; // backend uses topics, not category
  tags?: string[];
  userVote?: 'up' | 'down' | null;
}

interface Comment {
  id: string; // MongoDB ObjectId as string
  content: string;
  author: string; // MongoDB ObjectId as string
  authorName: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  commentsCount: number; // replies count
  postId?: string;
  parentCommentId?: string;
  replies?: Comment[];
  userVote?: 'up' | 'down' | null;
}

interface CommunityForumProps {
  forumData?: Post[];
  userData: any;
  onForumUpdate: () => void;
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
  )
};

export default function CommunityForumComponent({ 
  forumData, 
  userData, 
  onForumUpdate 
}: CommunityForumProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', topics: 'General' });
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [postFilter, setPostFilter] = useState<'all' | 'my-posts'>('all'); // NEW: Post filter state
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeReply, setActiveReply] = useState<string | null>(null);

  const categories = ['All', 'Teaching Methods', 'Student Management', 'Curriculum', 'Technology', 'General'];

  const fetchForumPosts = async () => {
    try {
      const response = await api.get('/api/forum/posts', { withCredentials: true });
      
      if (response.status === 200 && Array.isArray(response.data)) {
        // Map backend response exactly as it comes
        const mapped: Post[] = response.data.map((p: any) => ({
          id: p.id || '', // backend already sends 'id' not '_id'
          title: p.title || '',
          content: p.content || '',
          author: p.author || '',
          authorName: p.authorName || 'Anonymous',
          createdAt: p.createdAt || new Date().toISOString(),
          upvotes: typeof p.upvotes === 'number' ? p.upvotes : 0,
          downvotes: typeof p.downvotes === 'number' ? p.downvotes : 0,
          commentsCount: typeof p.commentsCount === 'number' ? p.commentsCount : 0,
          topics: p.topics || 'General',
          tags: p.tags || [],
          userVote: null
        }));
        setPosts(mapped);
      } else {
        toast.error('Failed to load forum posts');
      }
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      toast.error('Error fetching forum posts');
    }
  }

  useEffect(() => {
    // if forumData prop provided by parent, use it; otherwise fetch from API
    if (forumData && forumData.length > 0) {
      const validatedPosts = forumData.map(post => ({
        id: post.id || '',
        title: post.title || '',
        content: post.content || '',
        author: post.author || '',
        authorName: post.authorName || 'Anonymous',
        createdAt: post.createdAt || new Date().toISOString(),
        upvotes: typeof post.upvotes === 'number' ? post.upvotes : 0,
        downvotes: typeof post.downvotes === 'number' ? post.downvotes : 0,
        commentsCount: typeof post.commentsCount === 'number' ? post.commentsCount : 0,
        topics: post.topics || 'General',
        tags: post.tags || [],
        userVote: post.userVote || null
      }));
      setPosts(validatedPosts);
      return;
    }

    // no forumData prop -> fetch from backend on mount
    fetchForumPosts();
  }, [forumData]);

  // // Enhanced mock comments with nested replies
  // const mockComments: Comment[] = [
  //   {
  //     id: 1,
  //     content: "I've found that starting with visual representations of algorithms really helps beginners grasp the concepts faster. Using tools like flowchart diagrams before diving into code makes a huge difference.",
  //     author: "David Wilson",
  //     createdAt: "2024-01-15T11:00:00Z",
  //     upvotes: 8,
  //     downvotes: 0,
  //     postId: 1,
  //     userVote: null,
  //     replies: [
  //       {
  //         id: 11,
  //         content: "Completely agree! I use Miro for creating interactive flowcharts that students can collaborate on in real-time.",
  //         author: "Eva Brown",
  //         createdAt: "2024-01-15T11:30:00Z",
  //         upvotes: 4,
  //         downvotes: 0,
  //         postId: 1,
  //         parentCommentId: 1,
  //         userVote: null
  //       }
  //     ]
  //   },
  //   {
  //     id: 2,
  //     content: "Using platforms like Miro for visual collaboration and CodePen for live coding has worked wonders for my sessions. The real-time collaboration features are particularly helpful.",
  //     author: "Grace Lee",
  //     createdAt: "2024-01-15T12:30:00Z",
  //     upvotes: 12,
  //     downvotes: 1,
  //     postId: 1,
  //     userVote: null
  //   }
  // ];

  // NEW: Filter posts based on post filter (all posts vs my posts only)
  const filteredPosts = posts.filter(post => {
    const safeTitle = post.title?.toLowerCase() || '';
    const safeContent = post.content?.toLowerCase() || '';
    const safeSearchQuery = searchQuery.toLowerCase();
    
    const matchesSearch = safeTitle.includes(safeSearchQuery) || safeContent.includes(safeSearchQuery);
    const matchesCategory = selectedCategory === 'All' || post.topics === selectedCategory;
    const matchesPostFilter = postFilter === 'all' || post.authorName === userData?.name; // NEW: Filter by author for my posts
    
    return matchesSearch && matchesCategory && matchesPostFilter;
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;

    try {
      const payload = {
        title: newPost.title,
        content: newPost.content,
        topics: newPost.topics
      };

      const response = await api.post('/api/forum/posts', payload, { withCredentials: true });

      if (response.status === 201) {
        const created = response.data;

        // Map the created post exactly as backend returns it
        const newPostData: Post = {
          id: created._id || created.id || '',
          title: created.title || newPost.title,
          content: created.content || newPost.content,
          author: created.author || '',
          authorName: created.authorName || userData?.name || 'Anonymous',
          createdAt: created.createdAt || new Date().toISOString(),
          upvotes: 0,
          downvotes: 0,
          commentsCount: 0,
          topics: created.topics || newPost.topics,
          tags: [],
          userVote: null
        };

        setPosts(prev => [newPostData, ...prev]);
        setNewPost({ title: '', content: '', topics: 'General' });
        setIsCreatingPost(false);
        toast.success('Post created successfully!');
        onForumUpdate();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Error creating post');
    }
  };

  const handleVotePost = async (postId: string, voteType: 'up' | 'down') => {
    try {
      const endpoint = voteType === 'up' 
        ? `/api/forum/posts/upvote/${postId}` 
        : `/api/forum/posts/downvote/${postId}`;
      
      const response = await api.post(endpoint, {}, { withCredentials: true });

      if (response.status === 200) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const currentVote = post.userVote;
            let upvotes = post.upvotes;
            let downvotes = post.downvotes;

            if (currentVote === voteType) {
              // Undo vote
              if (voteType === 'up') upvotes = Math.max(0, upvotes - 1);
              else downvotes = Math.max(0, downvotes - 1);
              return { ...post, upvotes, downvotes, userVote: null };
            } else if (currentVote) {
              // Change vote
              if (currentVote === 'up') upvotes = Math.max(0, upvotes - 1);
              else downvotes = Math.max(0, downvotes - 1);
              if (voteType === 'up') upvotes++;
              else downvotes++;
              return { ...post, upvotes, downvotes, userVote: voteType };
            } else {
              // New vote
              if (voteType === 'up') upvotes++;
              else downvotes++;
              return { ...post, upvotes, downvotes, userVote: voteType };
            }
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Error voting on post');
    }
  };

  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    
    try {
      const response = await api.get(`/api/forum/posts/comments/${post.id}`, { withCredentials: true });
      
      if (response.status === 200 && Array.isArray(response.data)) {
        // Map backend comment response exactly as it comes
        const mapped: Comment[] = response.data.map((c: any) => ({
          id: c.id || '',
          content: c.content || '',
          author: c.author || '',
          authorName: c.authorName || 'Anonymous',
          createdAt: c.createdAt || new Date().toISOString(),
          upvotes: typeof c.upvotes === 'number' ? c.upvotes : 0,
          downvotes: typeof c.downvotes === 'number' ? c.downvotes : 0,
          commentsCount: typeof c.commentsCount === 'number' ? c.commentsCount : 0,
          postId: post.id,
          userVote: null,
          replies: []
        }));
        setComments(mapped);

        // Fetch replies for comments that indicate they have replies
        mapped.forEach(comment => {
          if (comment.commentsCount && comment.commentsCount > 0) {
            fetchRepliesForComment(comment.id, post.id);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Error fetching comments');
    }
  };

  const handleAddComment = async (content: string, parentCommentId?: string) => {
    if (!content.trim() || !selectedPost) return;

    try {
      const endpoint = parentCommentId 
        ? `/api/forum/comments/${parentCommentId}`
        : `/api/forum/posts/comment/${selectedPost.id}`;
      
      const response = await api.post(endpoint, { content }, { withCredentials: true });

      if (response.status === 201) {
        const created = response.data;
        const newCommentData: Comment = {
          id: created._id || created.id || '',
          content: created.content || content,
          author: created.author || '',
          authorName: created.authorName || userData?.name || 'Anonymous',
          createdAt: created.createdAt || new Date().toISOString(),
          upvotes: 0,
          downvotes: 0,
          commentsCount: 0,
          postId: selectedPost.id,
          parentCommentId,
          userVote: null,
          replies: []
        };

        if (parentCommentId) {
          // Add as reply to existing comment
          setComments(prev => prev.map(comment => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newCommentData],
                commentsCount: comment.commentsCount + 1
              };
            }
            return comment;
          }));
          setReplyContent(prev => ({ ...prev, [parentCommentId]: '' }));
          setActiveReply(null);
        } else {
          // Add as top-level comment
          setComments(prev => [newCommentData, ...prev]);
          setNewComment('');
        }

        // Update post comment count
        setPosts(prev => prev.map(post => 
          post.id === selectedPost.id 
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        ));

        setSelectedPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
        toast.success('Comment added successfully!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error adding comment');
    }
  };

  const handleVoteComment = async (commentId: string, voteType: 'up' | 'down') => {
    try {
      const endpoint = voteType === 'up' 
        ? `/api/forum/comments/upvote/${commentId}`
        : `/api/forum/comments/downvote/${commentId}`;
      
      const response = await api.post(endpoint, {}, { withCredentials: true });

      if (response.status === 200) {
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return updateCommentVote(comment, voteType);
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId ? updateCommentVote(reply, voteType) : reply
              )
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error voting comment:', error);
      toast.error('Error voting on comment');
    }
  };

  const updateCommentVote = (comment: Comment, voteType: 'up' | 'down') => {
    const currentVote = comment.userVote;
    let upvotes = comment.upvotes;
    let downvotes = comment.downvotes;

    if (currentVote === voteType) {
      // Undo vote
      if (voteType === 'up') upvotes = Math.max(0, upvotes - 1);
      else downvotes = Math.max(0, downvotes - 1);
      return { ...comment, upvotes, downvotes, userVote: null };
    } else if (currentVote) {
      // Change vote
      if (currentVote === 'up') upvotes = Math.max(0, upvotes - 1);
      else downvotes = Math.max(0, downvotes - 1);
      if (voteType === 'up') upvotes++;
      else downvotes++;
      return { ...comment, upvotes, downvotes, userVote: voteType };
    } else {
      // New vote
      if (voteType === 'up') upvotes++;
      else downvotes++;
      return { ...comment, upvotes, downvotes, userVote: voteType };
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await api.delete(`/api/forum/posts/${postId}`, { withCredentials: true });
      
      if (response.status === 200) {
        setPosts(prev => prev.filter(post => post.id !== postId));
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
          setShowCommentsModal(false);
        }
        toast.success('Post deleted successfully!');
        onForumUpdate();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    }
  };

  // helper to remove a comment (or reply) recursively
  const removeCommentRecursive = (list: Comment[], targetId: string): Comment[] => {
    return list.reduce<Comment[]>((acc, c) => {
      if (c.id === targetId) return acc;
      const newReplies = c.replies && c.replies.length ? removeCommentRecursive(c.replies, targetId) : c.replies;
      acc.push({ ...c, replies: newReplies });
      return acc;
    }, []);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const response = await api.delete(`/api/forum/comments/${commentId}`, { withCredentials: true });
      if (response.status === 200) {
        // remove from comments state
        setComments(prev => removeCommentRecursive(prev, commentId));
        // decrement post comment counts if selectedPost exists
        setPosts(prev => prev.map(p => p.id === selectedPost?.id ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p));
        setSelectedPost(prev => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : prev);
        toast.success('Comment deleted');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Error deleting comment');
    }
  };

  const fetchRepliesForComment = async (commentId: string, postId?: string) => {
    try {
      const targetPostId = postId || selectedPost?.id;
      if (!targetPostId) return;

      const response = await api.get(`/api/forum/comments/replies/${commentId}`, { withCredentials: true });
      if (response.status === 200 && Array.isArray(response.data)) {
        const replies: Comment[] = response.data.map((r: any) => ({
          id: r.id || r._id || '',
          content: r.content || '',
          author: r.author || '',
          authorName: r.authorName || 'Anonymous',
          createdAt: r.createdAt || new Date().toISOString(),
          upvotes: typeof r.upvotes === 'number' ? r.upvotes : 0,
          downvotes: typeof r.downvotes === 'number' ? r.downvotes : 0,
          commentsCount: typeof r.commentsCount === 'number' ? r.commentsCount : 0,
          postId: targetPostId,
          userVote: null,
          replies: []
        }));

        // inject replies into the correct comment
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies } : c));
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
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

  // Recursive component for nested comments
  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const isReply = depth > 0;
    
    return (
      <div className={`${styles.comment} ${isReply ? styles.reply : ''}`} style={{ marginLeft: depth * 20 }}>
        <div className={styles.commentContent}>
          <div className={styles.commentHeader}>
            <span className={styles.commentAuthor}>{comment.authorName}</span>
            <span className={styles.commentTime}>
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          
          <p className={styles.commentText}>{comment.content}</p>
          
          <div className={styles.commentFooter}>
            <div className={styles.voteSection}>
            <button 
              className={`${styles.voteButton} ${styles.upvote} ${comment.userVote === 'up' ? styles.active : ''}`}
              onClick={() => handleVoteComment(comment.id, 'up')}
              aria-label="Upvote comment"
            >
              <Icons.Upvote />
            </button>

              <span className={styles.voteCount}>
                {getVoteScore(comment.upvotes, comment.downvotes)}
              </span>
              <button 
                className={`${styles.voteButton} ${styles.downvote} ${comment.userVote === 'down' ? styles.active : ''}`}
                onClick={() => handleVoteComment(comment.id, 'down')}
                aria-label="Downvote comment"
              >
                <Icons.Downvote />
              </button>
            </div>

            <div className={styles.commentActions}>
              <button 
                className={styles.replyBtn}
                onClick={() => setActiveReply(activeReply === comment.id ? null : comment.id)}
                aria-label=" Reply comment"
              >
                Reply
              </button>
              {userData?.name === comment.author && (
                <>
                  <button className={styles.editBtn}>
                    Edit
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                </>
              )}
            </div>
          </div>

          {activeReply === comment.id && (
            <div className={styles.replyForm}>
              <textarea
                placeholder="Write a reply..."
                value={replyContent[comment.id] || ''}
                onChange={(e) => setReplyContent(prev => ({
                  ...prev,
                  [comment.id]: e.target.value
                }))}
                rows={2}
                className={styles.replyTextarea}
              />
              <div className={styles.replyActions}>
                <button 
                  className={styles.cancelReply}
                  onClick={() => setActiveReply(null)}
                  aria-label="Cancel reply"
                >
                  Cancel
                </button>
                <button 
                  className={styles.submitReply}
                  onClick={() => handleAddComment(replyContent[comment.id] || '', comment.id)}
                  disabled={!replyContent[comment.id]?.trim()}
                  aria-label="Submit reply"
                >
                  Reply
                </button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.communityForum}>
      {/* Sticky Header Section */}
      <div className={styles.stickyHeader}>
        <div className={styles.forumHeader}>
          <div className={styles.headerMain}>
            <div className={styles.headerTitle}>
              <h1>Community Forum</h1>
            </div>
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
                aria-label="Search discussions"
              />
            </div>
            <div className={styles.customSelect}>
              <select 
                aria-label="Select category"
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
            {/* NEW: Simple Post Filter Dropdown */}
            <div className={styles.customSelect}>
              <select 
                aria-label="Filter posts"
                value={postFilter}
                onChange={(e) => setPostFilter(e.target.value as 'all' | 'my-posts')}
                className={styles.postFilter}
              >
                <option value="all">All Posts</option>
                <option value="my-posts">My Posts</option>
              </select>
              <div className={styles.selectArrow}>▼</div>
            </div>
          </div>
          
          <button 
            className={styles.createPostBtn}
            onClick={() => setIsCreatingPost(true)}
            aria-label="Create new post"
            title="Create new post"
          >
            + Create Post
          </button>
        </div>
      </div>

      {isCreatingPost && (
        <div className={styles.createPostModal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Create New Post</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsCreatingPost(false)}
                aria-label="Close comments modal"

              >
                <Icons.Close />
              </button>
            </div>
            <form onSubmit={handleCreatePost}>
              <input
                type="text"
                placeholder="Post Title"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                required
                className={styles.titleInput}
              />
              <select
                value={newPost.topics}
                onChange={(e) => setNewPost(prev => ({ ...prev, topics: e.target.value }))}
                className={styles.categorySelect}
              >
                {categories.filter(cat => cat !== 'All').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <textarea
                placeholder="Post Content"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                required
                className={styles.contentTextarea}
              />
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setIsCreatingPost(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  aria-label="Submit new post"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.postsGrid}>
        {filteredPosts.map(post => (
          <div key={post.id} className={styles.postCard}>
            <div className={styles.postContent}>
              <div className={styles.postHeader}>
                <div className={styles.postMeta}>
                  <span className={styles.postCategory}>{post.topics || 'General'}</span>
                  <span className={styles.postAuthor}>by {post.authorName}</span>
                  <span className={styles.postTime}>{formatTimeAgo(post.createdAt)}</span>
                </div>
                <h3 className={styles.postTitle}>{post.title}</h3>
              </div>
              
              <div className={styles.postBody}>
                <p className={styles.postPreview}>{post.content}</p>
              </div>

              <div className={styles.postFooter}>
                <div className={styles.postActions}>
                  {userData?.name === post.author && (
                    <>
                      <button className={styles.actionBtn}>
                        <Icons.Edit />
                        Edit
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Icons.Delete />
                        Delete
                      </button>
                    </>
                  )}
                </div>
                
                <div className={styles.postRightActions}>
                  <button 
                    className={styles.commentsBtn}
                    onClick={() => handleOpenComments(post)}
                    aria-label="Open comment"
                  >
                    <Icons.Comments />
                    {post.commentsCount || 0}
                  </button>
                  
                  <div className={styles.voteSection}>
                    <button 
                      className={`${styles.voteButton} ${styles.upvote} ${post.userVote === 'up' ? styles.active : ''}`}
                      onClick={() => handleVotePost(post.id, 'up')}
                      aria-label="Upvote post"
                    >
                      <Icons.Upvote />
                    </button>
                    <span className={styles.voteCount}>
                      {getVoteScore(post.upvotes, post.downvotes)}
                    </span>
                    <button 
                      className={`${styles.voteButton} ${styles.downvote} ${post.userVote === 'down' ? styles.active : ''}`}
                      onClick={() => handleVotePost(post.id, 'down')}
                      aria-label="Downvote post"
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
            <p>
              {postFilter === 'my-posts' 
                ? "You haven't created any posts yet." 
                : "No posts found matching your criteria."}
            </p>
            <button 
              className={styles.createFirstPostBtn}
              onClick={() => setIsCreatingPost(true)}
              aria-label="Create the first post"
            >
              {postFilter === 'my-posts' ? 'Create your first post!' : 'Create the first post!'}
            </button>
          </div>
        )}
      </div>

      {/* Split-View Comments Modal */}
      {showCommentsModal && selectedPost && (
        <div className={styles.commentsModal}>
          <div className={styles.modalOverlay} onClick={() => setShowCommentsModal(false)} />
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Discussion</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCommentsModal(false)}
                aria-label="Close comments modal"
              >
                <Icons.Close />
              </button>
            </div>
            
            <div className={styles.modalSplitView}>
              {/* Left Side - Post Details */}
              <div className={styles.postSidebar}>
                <div className={styles.postCardDetailed}>
                  <div className={styles.postHeader}>
                    <div className={styles.postMeta}>
                      <span className={styles.postCategory}>{selectedPost.topics || 'General'}</span>
                      <span className={styles.postAuthor}>by {selectedPost.authorName}</span>
                      <span className={styles.postTime}>{formatTimeAgo(selectedPost.createdAt)}</span>
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
                        <div className={styles.voteSection}>
                          <button 
                            className={`${styles.voteButton} ${styles.upvote} ${selectedPost.userVote === 'up' ? styles.active : ''}`}
                            onClick={() => handleVotePost(selectedPost.id, 'up')}
                            aria-label="Upvote post"
                          >
                            <Icons.Upvote />
                          </button>
                          <span className={styles.voteCount}>
                            {getVoteScore(selectedPost.upvotes, selectedPost.downvotes)}
                          </span>
                          <button 
                            className={`${styles.voteButton} ${styles.downvote} ${selectedPost.userVote === 'down' ? styles.active : ''}`}
                            onClick={() => handleVotePost(selectedPost.id, 'down')}
                            aria-label="Downvote post"
                          >
                            <Icons.Downvote />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comment Form moved to left sidebar */}
                  <div className={styles.commentForm}>
                    <div className={styles.currentUser}>
                      Commenting as <strong>{userData?.name || 'Anonymous'}</strong>
                    </div>
                    <textarea
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className={styles.commentTextarea}
                    />
                    <button 
                      className={styles.commentSubmit}
                      onClick={() => handleAddComment(newComment)}
                      disabled={!newComment.trim()}
                      aria-label="Post comment"
                    >
                      Post Comment
                    </button>
                  </div>

                  {userData?.name === selectedPost.author && (
                    <div className={styles.ownerActions}>
                      <button className={styles.actionBtn}>
                        <Icons.Edit />
                        Edit
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleDeletePost(selectedPost.id)}
                      >
                        <Icons.Delete />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Comments Only */}
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
                          <p>No comments yet. Be the first to share your thoughts!</p>
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