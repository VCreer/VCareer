using Quartz;
using System;
using System.Threading.Tasks;
using VCareer.IServices.Subcriptions;
using Volo.Abp.BackgroundWorkers.Quartz;

namespace VCareer.Woker_Backgrounds
{
    public class JobEffectBackgroundJob : QuartzBackgroundWorkerBase
    {
        IJobAffectingService _jobEffectingService;
        public JobEffectBackgroundJob(IJobAffectingService jobAffectingService)
        {
            _jobEffectingService = jobAffectingService;
            JobDetail = JobBuilder.Create<JobEffectBackgroundJob>()
                            .WithIdentity("JobEffectBackgroundJob")
                            .Build();

            Trigger = TriggerBuilder.Create()
                .WithIdentity("JobEffectBackgroundJobTrigger")
                .StartNow()
                .WithCronSchedule("0 0/5 * * * ?") // sau đó mī 5 phút
                .Build();

        }
        public override async Task Execute(IJobExecutionContext context)
        {
            await _jobEffectingService.UpdateExpiredEffectingJobServiceBackgroundJob();
            Console.WriteLine("update expired effecting job - background worker");
        }
    }
}
