package com.AppBuilder.journalApp.services;

import com.AppBuilder.journalApp.entity.JournalEntry;
import com.AppBuilder.journalApp.entity.User;
import com.AppBuilder.journalApp.repository.JournalEntryRepo;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class JournalEntryService {

    @Autowired
    private JournalEntryRepo Repo;
    @Autowired
    private  UserService userService;

    @Transactional
    public void saveEntry(JournalEntry entry, String username){
        User user = userService.findByUserName(username);
        entry.setDate(LocalDateTime.now());
        JournalEntry saved = Repo.save(entry);
        user.getJournalEntries().add(saved);
        // --- FIX ---
        // Call the method that does NOT re-hash the password
        userService.saveUpdatedUser(user);
    }

    // Overloaded method for simple saves (like updating an entry)
    public void saveEntry(JournalEntry entry){
        Repo.save(entry);
    }

    public List<JournalEntry> getAll(){
        return Repo.findAll();
    }

    public Optional<JournalEntry> findById(ObjectId id){
        return Repo.findById(id);
    }

    @Transactional
    public void deleteById(ObjectId id, String username){
        User user = userService.findByUserName(username);
        user.getJournalEntries().removeIf(x -> x.getId().equals(id));

        // --- FIX ---
        // Call the method that does NOT re-hash the password
        userService.saveUpdatedUser(user);

        Repo.deleteById(id);
    }
}