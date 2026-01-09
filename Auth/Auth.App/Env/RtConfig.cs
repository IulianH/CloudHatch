using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Auth.App.Env
{
    public class RtConfig
    {
        [Range(0.1f, float.MaxValue, ErrorMessage = "RT ExpiresInHours must be greater than 0.1f.")]
        public float ExpiresInHours { get; set; }

        public float SessionMaxAgeHours { get; set; }
    }
}
