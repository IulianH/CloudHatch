﻿using Users.Domain;

namespace Users.App.Interface
{
    public interface IUserRepo
    {
        Task AddAsync(User user);

        Task<User?> FindByUserNameAsync(string userName);

        Task<User?> FindByIdAsync(Guid id);

        Task UpdateAsync(User user);

        void Migrate();
    }
}
