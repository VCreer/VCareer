using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace VCareer.Constants.JobConstant
{
    public class JobValidatorHelper
    {
        private static readonly Regex UrlRegex = new(
               @"((http|https):\/\/|www\.)[^\s]+",
               RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly List<string> AllowedDomains = new()
    {
        "yourcompany.com",
        "linkedin.com",
        "facebook.com"
    };

        public static List<string> DetectExternalLinks(string? description)
        {
            var externalLinks = new List<string>();
            if (string.IsNullOrWhiteSpace(description))
                return externalLinks;

            var matches = UrlRegex.Matches(description);
            foreach (Match match in matches)
            {
                var url = match.Value.Trim();
                try
                {
                    var host = new Uri(
                        url.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                            ? url
                            : "http://" + url).Host.ToLowerInvariant();

                    if (!AllowedDomains.Any(domain => host.Contains(domain)))
                    {
                        externalLinks.Add(url);
                    }
                }
                catch
                {
                    externalLinks.Add(url); // URL lỗi cú pháp
                }
            }

            return externalLinks;
        }
    }
}
