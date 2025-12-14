using Quartz;
using System;
using System.Threading.Tasks;
using VCareer.IServices.IJobServices;
using VCareer.Job.JobPosting.ISerices;
using Volo.Abp.BackgroundWorkers.Quartz;

namespace VCareer.Woker_Backgrounds
{
    public class JobPostStatusBackground : QuartzBackgroundWorkerBase
    {
        private readonly IJobPostService _jobPostService;
        public JobPostStatusBackground(IJobPostService jobPostService)
        {
            _jobPostService = jobPostService;
            JobDetail = JobBuilder.Create<JobPostStatusBackground>()
                .WithIdentity("JobPostStatusBackground")
                .Build();

            Trigger = TriggerBuilder.Create()
         .WithIdentity("JobPostStatusBackgroundTrigger")
         .StartNow()                               
         .WithCronSchedule("0 0/5 * * * ?") // sau đó mỗi 5 phút
         .Build();

        }
        public override async Task Execute(IJobExecutionContext context)
        {
            await _jobPostService.ExecuteExpiredJobPostBackgoundWorker();
            Console.WriteLine("delete expired job from index");
        }
    }

    public class ReIndexJobPostBackground : QuartzBackgroundWorkerBase
    {
        private readonly IJobSearchService _jobSearchService;
        public ReIndexJobPostBackground(IJobSearchService jobSearchService)
        {
            _jobSearchService = jobSearchService;
            JobDetail = JobBuilder.Create<ReIndexJobPostBackground>()
                .WithIdentity("ReIndexJobPostBackground")
                .Build();

            Trigger = TriggerBuilder.Create()
         .WithIdentity("ReIndexJobPostBackgroundTrigger")
         .StartNow()                    
         .WithCronSchedule("0 0 0 1 * ?") // sau đó chạy ngày 1 hằng tháng
         .Build();

        }
        public override async Task Execute(IJobExecutionContext context)
        {
            await _jobSearchService.ReindexAllJobsAsync();
            Console.WriteLine("reindex all jobs - background worker");
        }
    }
}
