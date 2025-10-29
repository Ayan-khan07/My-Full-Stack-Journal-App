package com.AppBuilder.journalApp.services;

import com.AppBuilder.journalApp.entity.User;
import com.AppBuilder.journalApp.repository.UserRepo;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepo Repo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // This method hashes the password (for new users)
    public void saveEntry(User user){
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        Repo.save(user);
    }

    // This method saves a user without touching the password (for updates)
    public void saveUpdatedUser(User user) {
        Repo.save(user);
    }

    public List<User> getAll(){
        return Repo.findAll();
    }

    public Optional<User> findById(ObjectId id){
        return Repo.findById(id);
    }

    public void deleteById(ObjectId id){
        Repo.deleteById(id);
    }

    public User findByUserName(String userName){
        return Repo.findByUserName(userName);
    }

    // This is the method Spring Security will call
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = Repo.findByUserName(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUserName())
                .password(user.getPassword()) // This MUST be the hashed password from your DB
                .roles("USER")
                .build();
    }
}