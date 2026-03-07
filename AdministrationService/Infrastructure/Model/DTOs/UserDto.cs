namespace AdministrationService.Infrastructure.Model
{

    public class UserDto: CreateUserDto
    {
        public Guid Id { get; set; }
    }// DTO nhận vào khi tạo User
    public class CreateUserDto
    {
        public string UserName { get; set; } = default!;
        public string FullName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? Password { get; set; } = default!; 
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        // Tương ứng phần Select Role trong hình
        public List<string> Roles { get; set; } = new(); 
        public bool IsActive { get; set; }
        public string? AvatarUrl { get; set; }
    }
}