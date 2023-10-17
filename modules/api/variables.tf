variable beacon-id {
  type = string
  description = "Unique identifier of the beacon. Use reverse domain name notation."
}

variable beacon-name {
  type = string
  description = "Human readable name of the beacon."
}

variable max_api_requests_per_ip_in_five_minutes {
  type = number
  default = 300
}

variable organisation-id {
  type = string
  description = "Unique identifier of the organization providing the beacon."
}

variable organisation-name {
  type = string
  description = "Name of the organization providing the beacon."
}

variable assembly-contig-sizes {
  type = map(map(number))
  description = "A map of assemblies to maps of maximum contig sizes in nucleotides."
}

variable common-tags {
  type = map(string)
  description = "A set of tags to attach to every created resource."
  default = {}
}
