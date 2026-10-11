import { useState } from 'react';
import { useRoute } from 'wouter';
import {
  useGetCommunity,
  useListForumPosts,
  useCreateForumPost,
  getGetCommunityQueryKey,
  getListForumPostsQueryKey,
} from '@workspace/api-client-react';
import { useAuthStore } from '../store/auth';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { MessageSquare, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../hooks/use-toast';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function ForumPage() {
  const [, params] = useRoute('/community/:slug/forum');
  const slug = params?.slug || '';
  const { user } = useAuthStore();
  const { toast } = useToast();

  const { data: community } = useGetCommunity(slug, {
    query: { enabled: !!slug, queryKey: getGetCommunityQueryKey(slug) },
  });
  const { data: posts, refetch } = useListForumPosts(slug, {
    query: { enabled: !!slug, queryKey: getListForumPostsQueryKey(slug) },
  });
  const createPost = useCreateForumPost();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !slug) return;

    createPost.mutate(
      { communitySlug: slug, data: { title, body } },
      {
        onSuccess: () => {
          toast({ title: 'Post created!' });
          setIsCreating(false);
          setTitle('');
          setBody('');
          refetch();
        },
      },
    );
  };

  if (!community) return <div className="container py-24">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div
        className="pt-16 pb-12 border-b"
        style={{ backgroundColor: `${community.accentColor}10` }}
      >
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div
            className="w-16 h-16 mx-auto bg-background rounded-full flex items-center justify-center text-3xl shadow-sm mb-4"
            style={{ border: `2px solid ${community.accentColor}` }}
          >
            {community.emoji}
          </div>
          <h1
            className="text-3xl md:text-4xl font-display font-bold mb-3"
            style={{ color: community.accentColor }}
          >
            {community.name} Community Forum
          </h1>
          <p className="text-muted-foreground">
            Ask for recipe tips, recommend products, or just say hello to your
            neighbors.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-display font-bold">
            Recent Discussions
          </h2>
          {user && (
            <Button
              onClick={() => setIsCreating(!isCreating)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> New Post
            </Button>
          )}
        </div>

        {isCreating && (
          <Card className="mb-8 border-primary/20 shadow-md">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's on your mind?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <textarea
                    required
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPost.isPending}>
                    Post
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Card
                key={post.id}
                className="hover:border-primary/30 transition-colors cursor-pointer group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg min-w-[60px]">
                      <MessageSquare className="w-5 h-5 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                      <span className="text-sm font-semibold">
                        {post.replyCount || 0}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {post.body}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {post.userName || 'Anonymous'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{' '}
                          {format(new Date(post.createdAt), 'MMM d')}
                        </span>
                        {post.isFlagged && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] py-0"
                          >
                            Flagged
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 bg-card border border-dashed rounded-xl">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground">
                No discussions yet. Be the first to post!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
