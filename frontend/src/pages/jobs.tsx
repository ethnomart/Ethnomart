import { useState } from 'react';
import { useListJobs, useApplyForJob } from '@workspace/api-client-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { MapPin, Briefcase, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function JobsPage() {
  const { data: jobs, isLoading } = useListJobs();
  const applyJob = useApplyForJob();
  const { toast } = useToast();

  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    applyJob.mutate(
      {
        id: selectedJob,
        data: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || undefined,
          coverLetter: formData.coverLetter,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Application Submitted',
            description: "We'll be in touch soon!",
          });
          setSelectedJob(null);
          setFormData({ fullName: '', email: '', phone: '', coverLetter: '' });
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Submission failed',
            description: 'Please try again.',
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none">
            Careers at EthnoMart
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Build the future of community commerce
          </h1>
          <p className="text-xl text-muted-foreground">
            Join our diverse team working to bring authentic cultural
            experiences to every neighborhood.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl relative">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4 max-w-2xl line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                      <span className="flex items-center gap-1 bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-md">
                        <Briefcase className="w-3.5 h-3.5" />{' '}
                        {job.type.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1 bg-accent/10 text-accent-foreground px-2 py-1 rounded-md">
                          {job.salary}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button onClick={() => setSelectedJob(job.id)}>
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-muted-foreground">
              No open positions right now. Check back later!
            </h3>
          </div>
        )}

        {/* Application Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl relative">
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <CardHeader>
                <CardTitle>Submit Application</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleApply} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Letter</Label>
                    <textarea
                      required
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.coverLetter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coverLetter: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={applyJob.isPending}
                  >
                    {applyJob.isPending
                      ? 'Submitting...'
                      : 'Submit Application'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
