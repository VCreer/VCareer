using System.Threading.Tasks;

namespace VCareer.Data;

public interface IVCareerDbSchemaMigrator
{
    Task MigrateAsync();
}
