using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace VCareer.Data;

/* This is used if database provider does't define
 * IVCareerDbSchemaMigrator implementation.
 */
public class NullVCareerDbSchemaMigrator : IVCareerDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
